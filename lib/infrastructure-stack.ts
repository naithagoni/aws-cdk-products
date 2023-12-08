import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { EcsFargateService } from "./elastic-container-service/ecs-fargate-service";
import { ApplicationLoadBalancerService } from "./application-load-balancer/alb-service";
import { DynamoDbService } from "./dynamodb/dydb-service";
import { VpcService } from "./virtual-private-cloud/vpc-service";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //? The code that defines your stack goes here

    // Create instances of the service constructs.
    const dyDbService = new DynamoDbService(this, "DynamoDb");
    const vpcService = new VpcService(this, "Vpc");
    const albService = new ApplicationLoadBalancerService(
      this,
      "ApplicationLoadBalancer"
    );
    const ecsFargate = new EcsFargateService(this, "EcsFargate");
  }
}
