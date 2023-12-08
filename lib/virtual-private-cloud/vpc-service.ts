import { Construct } from "constructs";
import * as aws_ec2 from "aws-cdk-lib/aws-ec2";

export class VpcService extends Construct {
  public vpcService;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC
    // NOTE: Limit AZs to avoid reaching resource quotas
    this.vpcService = new aws_ec2.Vpc(this, "ProductsVpc", {
      maxAzs: 2, // Specify the number of Availability Zones you need
      natGateways: 1,
    });
  }
}
