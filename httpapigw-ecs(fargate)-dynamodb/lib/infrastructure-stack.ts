import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as path from "path";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
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
    //   resource: ["*"],
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

    // Create Fargate service
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "my-fargate-service",
        {
          serviceName: "my-fargate-service",
          // securityGroups: [securityGroup],
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
              streamPrefix:
                "my-fargate-service-image/my-ecs-container/ecs-task-id",
              logGroup: logGroup,
            }),
            executionRole,
            taskRole,
            containerName: "my-ecs-container",
            containerPort: 80,
            dockerLabels: {},
          },
          desiredCount: 2,
          cpu: 512,
          memoryLimitMiB: 1024,
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
