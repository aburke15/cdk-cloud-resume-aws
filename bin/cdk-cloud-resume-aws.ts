#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkCloudResumePipelineStack } from '../lib/cdk-clould-resume-pipeline-stack';

const app = new cdk.App();
new CdkCloudResumePipelineStack(app, 'CdkCloudResumePipelineStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
