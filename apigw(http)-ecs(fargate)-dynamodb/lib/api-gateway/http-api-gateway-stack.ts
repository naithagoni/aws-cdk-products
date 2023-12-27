import { Construct } from "constructs";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { HttpAlbIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { FargateConfig } from "../application-load-balancer/fargate-stack";
import { VpcConfig } from "../virtual-private-cloud/vpc-config";
import { DynamoDbConfig } from "../dynamodb/dynamodb-stack";
import { LogsConfig } from "../logs/logs-stack";
import { IamConfig } from "../iam/iam-stack";
import { EcsClusterConfig } from "../elastic-container-service/ecs-stack";

export class HttpApiGatewayConfig extends Construct {
  public httpApi: apigwv2.HttpApi;
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

    const fargateConfig = new FargateConfig(
      this,
      "my-fargate-service",
      vpcConfig.securityGroup,
      ecsConfig.cluster,
      dynamoDbConfig.dyTable.tableName,
      logsConfig.logGroup,
      iamConfig.executionRole,
      iamConfig.taskRole
    );

    const vpcLink = new apigwv2.VpcLink(this, "my-vpc-link", {
      vpc: vpcConfig.vpc,
      vpcLinkName: "my-vpc-link",
      subnets: vpcConfig.vpc,
      securityGroups: [vpcConfig.securityGroup],
    });

    const api = new apigwv2.HttpApi(this, id, {
      apiName: id,
      description: "This is a basic HTTP API Gateway",
      createDefaultStage: false,
      corsPreflight: {
        allowCredentials: false,
        allowHeaders: ["*"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
      },
    });

    // Create a default stage
    api.addStage("default-http-api-stage", {
      // stageName: "stage",
      stageName: "$default",
      autoDeploy: true,
    });

    // Create an integration
    const integration = new HttpAlbIntegration(
      "private-alb-integration",
      fargateConfig.fargateService.listener,
      { vpcLink }
    );

    // Create Routes, Methods, and attach an integration
    api.addRoutes({
      path: "/items",
      methods: [apigwv2.HttpMethod.GET],
      integration: integration,
    });

    api.addRoutes({
      path: "/items/{id}",
      methods: [apigwv2.HttpMethod.GET],
      integration: integration,
    });

    api.addRoutes({
      path: "/items",
      methods: [apigwv2.HttpMethod.POST],
      integration: integration,
    });

    api.addRoutes({
      path: "/items/{id}",
      methods: [apigwv2.HttpMethod.PUT],
      integration: integration,
    });

    api.addRoutes({
      path: "/items/{id}",
      methods: [apigwv2.HttpMethod.DELETE],
      integration: integration,
    });

    this.httpApi = api;
  }
}
