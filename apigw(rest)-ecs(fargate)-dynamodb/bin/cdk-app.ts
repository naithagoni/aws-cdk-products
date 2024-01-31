#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { InfraStack } from "../lib/infrastructure-stack";

const app = new cdk.App();
new InfraStack(app, "MyInfra", {
  /* If you don't specify 'env', this stack will be environment-agnostic. */
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
