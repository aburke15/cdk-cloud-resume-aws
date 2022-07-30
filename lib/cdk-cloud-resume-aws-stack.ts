import * as CDK from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import * as DDB from 'aws-cdk-lib/aws-dynamodb';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

type MemoryAndTimeoutOptions = {
  readonly memorySize: number;
  readonly timeout: CDK.Duration;
};

type BundlingOptions = {
  readonly externalModules: string[];
  readonly minify: boolean;
};

const memoryAndTimeout: MemoryAndTimeoutOptions = {
  memorySize: 128,
  timeout: CDK.Duration.seconds(30),
};

const bundling: BundlingOptions = {
  externalModules: ['aws-sdk', 'aws-lambda'],
  minify: true,
};

const directory = 'lambda';
const handlerName = 'handler';

export class CdkCloudResumeAwsStack extends CDK.Stack {
  constructor(scope: Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props);

    const cloudResumeTable = new DDB.Table(this, 'CloudResumeTable', {
      partitionKey: { name: 'id', type: DDB.AttributeType.NUMBER },
      billingMode: DDB.BillingMode.PAY_PER_REQUEST,
      removalPolicy: CDK.RemovalPolicy.DESTROY,
    });

    const cloudResumeBucket = new Bucket(this, 'CloudResumeBucket', {
      publicReadAccess: true,
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      autoDeleteObjects: true,
    });

    const deployment = new BucketDeployment(this, 'CloudResumeBucketDeployment', {
      sources: [Source.asset('./websites')],
      destinationBucket: cloudResumeBucket,
    });

    const pageVistReadHandler = new NodejsFunction(this, 'PageVisitReadHandler', {
      runtime: Runtime.NODEJS_14_X,
      memorySize: memoryAndTimeout.memorySize,
      timeout: memoryAndTimeout.timeout,
      entry: Code.fromAsset(directory).path + '/page-visit-read-handler.ts',
      handler: handlerName,
      bundling,
      environment: {
        TABLE_NAME: cloudResumeTable.tableName,
      },
    });

    const pageVistIncrementHandler = new NodejsFunction(this, 'PageVisitIncrementHandler', {
      runtime: Runtime.NODEJS_14_X,
      memorySize: memoryAndTimeout.memorySize,
      timeout: memoryAndTimeout.timeout,
      entry: Code.fromAsset(directory).path + '/page-visit-increment-handler.ts',
      handler: handlerName,
      bundling,
      environment: {
        TABLE_NAME: cloudResumeTable.tableName,
        DOWNSTREAM: pageVistReadHandler.functionName,
      },
    });

    pageVistReadHandler.grantInvoke(pageVistIncrementHandler);
    cloudResumeTable.grantReadWriteData(pageVistIncrementHandler);
    cloudResumeTable.grantReadData(pageVistReadHandler);

    const api = new LambdaRestApi(this, 'CloudResumeApi', {
      handler: pageVistIncrementHandler,
      proxy: false,
    });

    const count = api.root.addResource('count');

    count.addMethod('GET');
    count.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    });
  }
}
