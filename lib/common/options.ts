import * as CDK from 'aws-cdk-lib';

export interface MemoryAndTimeoutOptions {
  readonly memorySize: number;
  readonly timeout: CDK.Duration;
}

export interface BundlingOptions {
  readonly externalModules: string[];
  readonly minify: boolean;
}
