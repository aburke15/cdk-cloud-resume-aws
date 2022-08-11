import { Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { CdkCloudResumePipelineStage } from './cdk-cloud-resume-pipeline-stage';

export class CdkCloudResumePipelineStack extends Stack {
  private readonly cloudResumePipeline: string = 'CloudResumePipeline';

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline: CodePipeline = new CodePipeline(this, this.cloudResumePipeline, {
      pipelineName: this.cloudResumePipeline,
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('aburke15/cdk-cloud-resume-aws', 'main'),
        commands: ['npm ci', 'npm run build', 'npx cdk synth'],
      }),
    });

    pipeline.addStage(new CdkCloudResumePipelineStage(this, `${this.cloudResumePipeline}Stage`));
  }
}
