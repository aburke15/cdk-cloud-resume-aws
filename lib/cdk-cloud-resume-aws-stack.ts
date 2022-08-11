import * as CDK from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import * as DDB from 'aws-cdk-lib/aws-dynamodb';
import { Code, IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ARecord, PublicHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGateway } from 'aws-cdk-lib/aws-route53-targets';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as Options from './common/options';

const memoryAndTimeout: Options.MemoryAndTimeoutOptions = {
  memorySize: 128,
  timeout: CDK.Duration.seconds(30),
};

const bundling: Options.BundlingOptions = {
  externalModules: ['aws-sdk', 'aws-lambda'],
  minify: true,
};

export class CdkCloudResumeAwsStack extends CDK.Stack {
  private readonly directory: string = 'lambda';
  private readonly handler: string = 'handler';
  private readonly cloudResume: string = 'CloudResume';
  private readonly domainName: string = 'aburke.tech';
  private readonly cloud: string = 'cloud';

  constructor(scope: Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props);

    const cloudResumeTable = new DDB.Table(this, `${this.cloudResume}Table`, {
      partitionKey: { name: 'id', type: DDB.AttributeType.NUMBER },
      billingMode: DDB.BillingMode.PAY_PER_REQUEST,
      removalPolicy: CDK.RemovalPolicy.DESTROY,
    });

    const cloudResumeBucket = new Bucket(this, `${this.cloudResume}Bucket`, {
      publicReadAccess: true,
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      autoDeleteObjects: true,
    });

    new BucketDeployment(this, `${this.cloudResume}BucketDeployment`, {
      sources: [Source.asset('./websites')],
      destinationBucket: cloudResumeBucket,
    });

    const readFunction: IFunction = new NodejsFunction(this, 'PageVisitCountReadFunction', {
      runtime: Runtime.NODEJS_14_X,
      memorySize: memoryAndTimeout.memorySize,
      timeout: memoryAndTimeout.timeout,
      entry: Code.fromAsset(this.directory).path + '/page-visit-count-read-function.ts',
      handler: this.handler,
      bundling,
      environment: {
        TABLE_NAME: cloudResumeTable.tableName,
      },
    });

    const incrementFunction: IFunction = new NodejsFunction(this, 'PageVisitCountIncrementFunction', {
      runtime: Runtime.NODEJS_14_X,
      memorySize: memoryAndTimeout.memorySize,
      timeout: memoryAndTimeout.timeout,
      entry: Code.fromAsset(this.directory).path + '/page-visit-count-increment-function.ts',
      handler: this.handler,
      bundling,
      environment: {
        TABLE_NAME: cloudResumeTable.tableName,
        DOWNSTREAM: readFunction.functionName,
      },
    });

    readFunction.grantInvoke(incrementFunction);
    cloudResumeTable.grantReadWriteData(incrementFunction);
    cloudResumeTable.grantReadData(readFunction);

    const api = new LambdaRestApi(this, `${this.cloudResume}Api`, {
      handler: incrementFunction,
      proxy: false,
    });

    const count = api.root.addResource('count');

    count.addMethod('GET');
    count.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    });

    // get secrets for hosted zone and certificate
    const zoneSecret = Secret.fromSecretNameV2(this, `AburkeTechHostedZoneIdSecret`, `AburkeTechHostedZoneId`);
    const certSecret = Secret.fromSecretNameV2(this, `AburkeTechCertificateArnSecret`, `AburkeTechCertificateArn`);

    const zoneId: string = zoneSecret?.secretValue?.unsafeUnwrap()?.toString();
    const certArn: string = certSecret?.secretValue?.unsafeUnwrap()?.toString();

    const aburkeTechCert = Certificate.fromCertificateArn(this, `AburkeTechCertificate`, certArn);

    const aburkeTechZone = PublicHostedZone.fromPublicHostedZoneAttributes(this, `AburkeTechPublicHostedZone`, {
      hostedZoneId: zoneId,
      zoneName: this.domainName,
    });

    api.addDomainName(`${this.cloudResume}ApiDomain`, {
      domainName: `${this.cloud}.${this.domainName}`,
      certificate: aburkeTechCert,
    });

    new ARecord(this, `${this.cloudResume}ARecord`, {
      zone: aburkeTechZone,
      target: RecordTarget.fromAlias(new ApiGateway(api)),
      recordName: this.cloud,
    });
  }
}
