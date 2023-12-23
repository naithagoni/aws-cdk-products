import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { VpcConfig } from "../virtual-private-cloud/vpc-config";

export class EcsClusterConfig extends Construct {
  public ecsCluster: ecs.Cluster;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpcConfig = new VpcConfig(this, "");

    // Create ECS cluster
    this.ecsCluster = new ecs.Cluster(this, "my-ecs-cluster", {
      clusterName: "my-ecs-cluster",
      vpc: vpcConfig.vpc,
    });
  }
}
