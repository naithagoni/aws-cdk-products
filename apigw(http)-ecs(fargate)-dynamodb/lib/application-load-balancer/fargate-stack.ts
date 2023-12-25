import { Construct } from "constructs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as path from "path";
import { IamConfig } from "../iam/iam-stack";
import { LogsConfig } from "../logs/logs-stack";
import { VpcConfig } from "../virtual-private-cloud/vpc-config";
import { DynamoDbConfig } from "../dynamodb/dynamodb-stack";
import { EcsClusterConfig } from "../elastic-container-service/ecs-stack";

export class FargateConfig extends Construct {
  public fargateService: ecs_patterns.ApplicationLoadBalancedFargateService;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Instantiate configs
    const vpcConfig = new VpcConfig(this, "my-vpc");
    const dynamoDbConfig = new DynamoDbConfig(this, "my-dynamo-db");
    const logsConfig = new LogsConfig(this, "my-log-group");
    const iamConfig = new IamConfig(
      this,
      "my-ecs",
      dynamoDbConfig.dyTable.tableArn
    );
    const ecsConfig = new EcsClusterConfig(
      this,
      "my-ecs-cluster",
      vpcConfig.vpc
    );

    // Create Fargate service
    const fgService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      id,
      {
        serviceName: id,
        securityGroups: [vpcConfig.securityGroup],
        cluster: ecsConfig.cluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromAsset(
            path.resolve(__dirname, "../../src/")
          ),
          environment: {
            DYNAMO_TABLE_NAME: dynamoDbConfig.dyTable.tableName,
            REGION: process.env.CDK_DEFAULT_REGION!,
          },
          enableLogging: true,
          logDriver: new ecs.AwsLogDriver({
            streamPrefix: "my-fargate-service",
            logGroup: logsConfig.logGroup,
          }),
          executionRole: iamConfig.executionRole,
          taskRole: iamConfig.taskRole,
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
