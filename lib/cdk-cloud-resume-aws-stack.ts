import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

const memoryAndTimeout = {
  memorySize: 128,
  timeout: Duration.minutes(2),
} as const;

export class CdkCloudResumeAwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'CloudResumeBucket', {
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      autoDeleteObjects: true,
    });

    const deployment = new BucketDeployment(this, 'CloudResumeBucketDeployment', {
      sources: [Source.asset('./websites')],
      destinationBucket: bucket,
    });

    const table = new Table(this, 'CloudResumeTable', {
      partitionKey: { name: 'id', type: AttributeType.NUMBER },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const folder = 'lambda';
    const handlerName = 'handler';

    const pageVistReadHandler = new NodejsFunction(this, 'PageVisitReadHandler', {
      runtime: Runtime.NODEJS_14_X,
      memorySize: memoryAndTimeout.memorySize,
      timeout: memoryAndTimeout.timeout,
      entry: Code.fromAsset(folder).path + '/page-visit-read-handler.ts',
      handler: handlerName,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    const pageVistIncrementHandler = new NodejsFunction(this, 'PageVisitIncrementHandler', {
      runtime: Runtime.NODEJS_14_X,
      memorySize: memoryAndTimeout.memorySize,
      timeout: memoryAndTimeout.timeout,
      entry: Code.fromAsset(folder).path + '/page-visit-increment-handler.ts',
      handler: handlerName,
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
        DOWNSTREAM: pageVistReadHandler.functionName,
      },
    });

    pageVistReadHandler.grantInvoke(pageVistIncrementHandler);
    table.grantReadWriteData(pageVistIncrementHandler);
    table.grantReadData(pageVistReadHandler);

    const api = new LambdaRestApi(this, 'CloudResumeApi', {
      handler: pageVistIncrementHandler,
      proxy: false,
    });

    const count = api.root.addResource('count');

    count.addMethod('GET');
    count.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['ANY'],
    });
  }
}
