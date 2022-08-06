import { StackProps, Stage } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CdkCloudResumeAwsStack } from './cdk-cloud-resume-aws-stack';

export class CdkCloudResumePipelineStage extends Stage {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new CdkCloudResumeAwsStack(this, 'CdkCloudResumeAwsStack');
  }
}
