import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class VpcConfig extends Construct {
  public vpc: ec2.Vpc;
  public securityGroup: ec2.SecurityGroup;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC
    this.vpc = new ec2.Vpc(this, id, {
      vpcName: id,
      cidr: "10.0.0.0/16",
      defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
      maxAzs: 2, // OR availabilityZones: ["us-east-1a", "us-east-1b"],
      natGateways: 1,
    });

    // Create a Security group
    const secGroup = new ec2.SecurityGroup(this, "my-security-group", {
      securityGroupName: "my-security-group",
      description: "security group",
      vpc: this.vpc,
      allowAllOutbound: true,
    });

    secGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      /**
       * To, allow SSH access from anyhwere -> ec2.Port.tcp(22).
       * To, allow HTTP traffic from anyhwere -> ec2.Port.tcp(80).
       * To, allow HTTPS traffic from anyhwere -> ec2.Port.tcp(443).
       * To, allow ICMP traffic from a specific IP range -> ec2.Peer.ipv4('123.123.123.123/16'), ec2.Port.allIcmp().
       */
      ec2.Port.allTraffic(),
      "allow traffic from anyhwere"
    );

    secGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
      "allow outgoing traffic to anywhere"
    );

    this.securityGroup = secGroup;
  }
}
