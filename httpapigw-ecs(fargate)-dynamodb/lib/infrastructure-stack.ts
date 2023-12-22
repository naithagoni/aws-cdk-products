import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { FargateConfig } from "./application-load-balancer/fargate-stack";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const fargateConfig = new FargateConfig(this, "my-fargate-service");

    // Load balancer url
    new cdk.CfnOutput(this, "loadBalancerUrl", {
      value: fargateConfig.fargateService.loadBalancer.loadBalancerDnsName,
      exportName: "loadBalancerUrl",
    });
  }
}
