import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class CdkCloudResumeAwsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucket = new Bucket(this, 'CloudResumeBucket', {
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: 'index.html',
      autoDeleteObjects: true,
    });

    new BucketDeployment(this, 'CloudResumeBucketDeployment', {
      sources: [Source.asset('./websites')],
      destinationBucket: bucket,
    });

    const table = new Table(this, 'CloudResumeTable', {
      partitionKey: { name: 'id', type: AttributeType.NUMBER },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const handler = new NodejsFunction(this, 'CloudResumeHandler', {
      runtime: Runtime.NODEJS_14_X,
      memorySize: 128,
      timeout: Duration.minutes(2),
      entry: Code.fromAsset('lambda').path + '/cloud-resume-handler.ts',
      handler: 'handler',
      bundling: {
        externalModules: ['aws-sdk'],
        minify: true,
      },
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantReadWriteData(handler);

    const api = new LambdaRestApi(this, 'CloudResumeApi', {
      handler: handler,
      proxy: false,
    });

    const count = api.root.addResource('count');
    count.addMethod('GET');
  }
}
