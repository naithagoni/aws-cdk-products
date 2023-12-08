import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import * as aws_ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { VpcService } from "../virtual-private-cloud/vpc-service";
import { DynamoDbService } from "../dynamodb/dydb-service";
import { ApplicationLoadBalancerService } from "../application-load-balancer/alb-service";

export class EcsFargateService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const vpcService = new VpcService(this, "VpcService");
    const albService = new ApplicationLoadBalancerService(this, "ApplicationLoadBalancerService");
    const dyDbService = new DynamoDbService(this, "ProductsDb");

    // Create an ECS Fargate Cluster for hosting your Fargate service
    const productsCluster = new aws_ecs.Cluster(this, "ProductsCluster", {
      vpc: vpcService.vpcService,
    });

    // Instantiate Fargate Service with cluster and image
    const productsFargateService =
      // If you're using 'ecs_patterns.ApplicationLoadBalancedEc2Service', then you have to "Add EC2 Capacity to the Cluster". Something like:
      // productsCluster.addAutoScalingGroup({
      //   instanceType: new aws_ec2.InstanceType("t2.micro"),
      //   minCapacity: 1,
      //   maxCapacity: 3,
      // });
      
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "ProductsFargateService",
        {
          cluster: productsCluster,
          desiredCount: 2,
          cpu: 512,
          memoryLimitMiB: 1024,
          // loadBalancerName: albService.alb.loadBalancerName,
          taskImageOptions: {
            image: aws_ecs.ContainerImage.fromAsset(path.resolve(__dirname, '../../api-service/')),
            // image: aws_ecs.ContainerImage.fromAsset("../../api-service/"),
            environment: {},
            containerName: "my-products-fargate-container",
            containerPort: 3000,
            taskRole: dyDbService.iamRole
          },
        }
      );

    // Health check
    productsFargateService.targetGroup.configureHealthCheck({
      path: "/health",
    });

    // Load balancer url
    new cdk.CfnOutput(this, "loadBalancerUrl", {
      value: productsFargateService.loadBalancer.loadBalancerDnsName,
      exportName: "loadBalancerUrl",
    });
  }
}
