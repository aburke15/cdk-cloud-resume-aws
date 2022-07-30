import * as CDK from 'aws-cdk-lib';

export type MemoryAndTimeoutOptions = {
  readonly memorySize: number;
  readonly timeout: CDK.Duration;
};

export type BundlingOptions = {
  readonly externalModules: string[];
  readonly minify: boolean;
};
