import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as path from "path";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, "my-vpc", {
      vpcName: "my-vpc",
      cidr: "10.0.0.0/16",
      defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
      availabilityZones: ["us-east-1a", "us-east-1b"], // OR maxAzs: 2,
      natGateways: 1,
    });

    /** IAM Roles & Policies */
    // Create ECS Task Role
    const taskRole = new iam.Role(this, "my-ecs-task-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "my-ecs-task-role",
      description: "This is a Task Role for ECS",
    });

    // Create ECS Execution Role
    const executionRole = new iam.Role(this, "my-ecs-execution-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "my-ecs-execution-role",
      description: "This is a Execution Role for ECS",
    });

    // // Create a custom IAM policy statement
    // const customExecutionRolePolicyStatement = {
    //   effect: iam.Effect.ALLOW,
    //   action: [
    //     "ecr:GetAuthorizationToken",
    //     "ecr:BatchCheckLayerAvailability",
    //     "ecr:GetDownloadUrlForLayer",
    //     "ecr:BatchGetImage",
    //     "logs:CreateLogStream",
    //     "logs:PutLogEvents",
    //   ],
    //   resource: [logGroup.logGroupArn],
    // };

    // // Create a custom policy
    // const newExecutionRolePolicy = new iam.Policy(
    //   this,
    //   "my-ecs-execution-role-policy",
    //   {
    //     policyName: "my-ecs-execution-role-policy",
    //     statements: [
    //       new iam.PolicyStatement(customExecutionRolePolicyStatement),
    //     ],
    //   }
    // );

    // // Attach a custom policy to an execution role
    // executionRole.attachInlinePolicy(newExecutionRolePolicy);

    // Alternatively, Add a managed policy to roles
    // taskRole.addManagedPolicy(
    //   iam.ManagedPolicy.fromAwsManagedPolicyName(
    //     "service-role/AmazonECSTaskExecutionRolePolicy"
    //   )
    // );

    executionRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        // ? Some managed policy names start with "service-role/", some start with "job-function/", and some don't start with anything. Do include the prefix when constructing this object.
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );

    // Create a Security group
    const securityGroup = new ec2.SecurityGroup(this, "my-security-group", {
      securityGroupName: "my-security-group",
      description: "security group",
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
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

    securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
      "allow outgoing traffic to anywhere"
    );

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, "my-ecs-cluster", {
      clusterName: "my-ecs-cluster",
      vpc,
    });

    /** Logs */
    const logGroup = new logs.LogGroup(this, "my-log-group", {
      logGroupName: "my-log-group",
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const logStream = new logs.LogStream(this, "my-log-stream", {
      logGroup: logGroup,
      logStreamName: "my-log-stream",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Fargate service
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "my-fargate-service",
        {
          serviceName: "my-fargate-service",
          taskSubnets: {
            subnets: [...vpc.publicSubnets],
          },
          securityGroups: [securityGroup],
          cluster: cluster,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset(
              path.resolve(__dirname, "../src/")
            ),
            environment: {
              MY_VAR: "variable01",
            },
            enableLogging: true,
            logDriver: new ecs.AwsLogDriver({
              streamPrefix: logStream.logStreamName,
              logGroup: logGroup,
            }),
            executionRole,
            taskRole,
            containerName: "my-ecs-container",
            containerPort: 80,
            dockerLabels: {},
          },
          publicLoadBalancer: true,
          openListener: true,
          listenerPort: 80,
          desiredCount: 2,
          cpu: 512,
          memoryLimitMiB: 1024,
        }
      );

    // Create a Target group with type IP and register targets with PrivateSubnet1 and PrivateSubnet2
    // --> "Primary Private IPv4 address(you get it from Network interfaces)".
    // Create a Target Group
    // const targetGroup = new elbv2.ApplicationTargetGroup(
    //   this,
    //   "my-ip-target-group",
    //   {
    //     targetType: elbv2.TargetType.IP,
    //     targetGroupName: "my-ip-target-group",
    //     protocol: elbv2.ApplicationProtocol.HTTP,
    //     port: 80,
    //     vpc: vpc,
    //     protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,
    //     healthCheck: {
    //       enabled: true,
    //       protocol: elbv2.Protocol.HTTP,
    //       path: "/health",
    //       // The port the load balancer uses when performing health checks on targets.
    //       // By default, the health check port is the same as the target group's traffic port
    //       port: "traffic-port",
    //     },
    //   }
    // );

    // fargateService.loadBalancer.addListener("my-alb-listener", {
    //   protocol: elbv2.ApplicationProtocol.HTTP,
    //   port: 80,
    //   defaultTargetGroups: [targetGroup], // OR defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    //   open: true,
    // });

    // // Health check
    // fargateService.targetGroup.configureHealthCheck({ path: "/health" });

    // Load balancer url
    new cdk.CfnOutput(this, "loadBalancerUrl", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      exportName: "loadBalancerUrl",
    });
  }
}
