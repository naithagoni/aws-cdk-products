import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";

export class EcsClusterConfig extends Construct {
  public cluster: ecs.Cluster;
  constructor(scope: Construct, id: string, vpc: ec2.Vpc) {
    super(scope, id);

    // Create ECS cluster
    this.cluster = new ecs.Cluster(this, id, {
      clusterName: id,
      vpc: vpc,
    });
  }
}
