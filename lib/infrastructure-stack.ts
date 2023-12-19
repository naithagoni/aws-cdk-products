import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as path from "path";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, "my-vpc", {
      vpcName: "my-vpc",
      maxAzs: 2,
      natGateways: 1,
    });

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, "my-ecs-cluster", {
      clusterName: "my-ecs-cluster",
      vpc,
    });

    // Create Fargate service
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "my-fargate-service",
        {
          cluster: cluster,
          memoryLimitMiB: 1024,
          cpu: 512,
          desiredCount: 2,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset(
              path.join(__dirname, "../api-service/")
            ),
            containerName: "my-container",
            containerPort: 80,
            environment: {
              MY_VAR: "variable01",
            },
          },
        }
      );

    // Health check
    fargateService.targetGroup.configureHealthCheck({ path: "/health" });

    // Load balancer url
    new cdk.CfnOutput(this, "loadBalancerUrl", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      exportName: "loadBalancerUrl",
    });
  }
}
