import { Construct } from "constructs";
import * as aws_elb2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { VpcService } from "../virtual-private-cloud/vpc-service";

export class ApplicationLoadBalancerService extends Construct {
  public alb;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpcService = new VpcService(this, "VpcService");
    // Create an Application Load Balancer for ECS
    this.alb = new aws_elb2.ApplicationLoadBalancer(
      this,
      "ProductsApplicationLoadBalancer",
      {
        vpc: vpcService.vpcService,
        internetFacing: true,
      }
    );
  }
}
