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
  public stage: apigwv2.HttpStage;
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
    });

    const api = new apigwv2.HttpApi(this, id, {
      apiName: id,
      description: "This is a basic HTTP methods",
      // defaultIntegration:
      createDefaultStage: true,
      corsPreflight: {
        allowCredentials: false,
        allowHeaders: ["*"],
        allowMethods: [apigwv2.CorsHttpMethod.ANY],
        allowOrigins: ["*"],
        // exposeHeaders: []
      },
    });

    // Create a custom stage
    // this.stage = new apigwv2.HttpStage(this, "my-custom-stage", {
    //   httpApi: api,
    //   stageName: "dev",
    //   autoDeploy: true,
    // });

    // Create Route, Method, and attach an integration
    api.addRoutes({
      path: "/items",
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpAlbIntegration(
        "default-integration",
        fargateConfig.fargateService.listener,
        { vpcLink, method: apigwv2.HttpMethod.GET }
      ),
    });
  }
}
