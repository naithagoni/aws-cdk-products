import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";
import { Role } from "aws-cdk-lib/aws-iam";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { LogGroup } from "aws-cdk-lib/aws-logs";

export class FargateConfig extends Construct {
  public fargateService: ecs_patterns.ApplicationLoadBalancedFargateService;
  constructor(
    scope: Construct,
    id: string,
    securityGroup: SecurityGroup,
    cluster: Cluster,
    tableName: string,
    logGroup: LogGroup,
    executionRole: Role,
    taskRole: Role
  ) {
    super(scope, id);

    // Create Fargate service
    const fgService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      id,
      {
        serviceName: id,
        securityGroups: [securityGroup],
        cluster: cluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(
            path.resolve(__dirname, "../../src/")
          ),
          environment: {
            DYNAMO_TABLE_NAME: tableName,
            REGION: process.env.CDK_DEFAULT_REGION!,
          },
          enableLogging: true,
          logDriver: new ecs.AwsLogDriver({
            streamPrefix: "my-fargate-service",
            logGroup: logGroup,
          }),
          executionRole: executionRole,
          taskRole: taskRole,
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

    // Health check
    fgService.targetGroup.configureHealthCheck({ path: "/health" });

    this.fargateService = fgService;
  }
}
