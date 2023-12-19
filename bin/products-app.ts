#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
// import { CfnGuardValidator } from "@cdklabs/cdk-validator-cfnguard";
import { InfraStack } from "../lib/infrastructure-stack";

const app = new cdk.App();
//   {
//   policyValidationBeta1: [new CfnGuardValidator({
//     controlTowerRulesEnabled: false,
//   })],
//   // By default, the report will be printed in a human readable format. If you want a report in JSON format, enable it.
//   context: { '@aws-cdk/core:validationReportJson': true },
// }
// only apply to a particular stage
// const prodStage = new Stage(app, 'ProdStage', {
//   policyValidationBeta1: [...],
// });
new InfraStack(app, "MyInfra", {
  /* If you don't specify 'env', this stack will be environment-agnostic. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  env: { account: "680048507123", region: "us-east-1" },
});
