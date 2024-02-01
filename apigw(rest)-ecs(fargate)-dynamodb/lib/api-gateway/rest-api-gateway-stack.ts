import { Construct } from "constructs";
import { RemovalPolicy } from "aws-cdk-lib/core";
import * as logs from "aws-cdk-lib/aws-logs";
import * as apigwv from "aws-cdk-lib/aws-apigateway";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { FargateConfig } from "../application-load-balancer/fargate-stack";
import { VpcConfig } from "../virtual-private-cloud/vpc-config";
import { DynamoDbConfig } from "../dynamodb/dynamodb-stack";
import { LogsConfig } from "../logs/logs-stack";
import { IamConfig } from "../iam/iam-stack";
import { EcsClusterConfig } from "../elastic-container-service/ecs-stack";

export class RestApiGatewayConfig extends Construct {
  public restApi: apigwv.RestApi;
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

    //   fargateConfig.fargateService.listener,
    const integration = new apigwv.Integration({
      type: apigwv.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: "ANY",
      uri: `http://${fargateConfig.fargateService.loadBalancer.loadBalancerDnsName}`,
    });

    const restApiLogGroup = new logs.LogGroup(this, "my-rest-api-log-group");

    const api = new apigwv.RestApi(this, id, {
      restApiName: id,
      description: "This is a basic REST API Gateway",
      endpointTypes: [apigwv.EndpointType.REGIONAL],
      deployOptions: {
        accessLogDestination: new apigwv.LogGroupLogDestination(
          restApiLogGroup
        ),
        accessLogFormat: apigwv.AccessLogFormat.jsonWithStandardFields(),
      },
      cloudWatchRole: true, // Automatically configure an AWS CloudWatch role for API Gateway.
      cloudWatchRoleRemovalPolicy: RemovalPolicy.DESTROY,
      defaultCorsPreflightOptions: {
        allowCredentials: false,
        allowHeaders: apigwv.Cors.DEFAULT_HEADERS,
        allowMethods: apigwv.Cors.ALL_METHODS,
        allowOrigins: apigwv.Cors.ALL_ORIGINS,
      },
    });

    // Create API Gateway Deployment
    const deployment = new apigwv.Deployment(this, "my-rest-api-deployment", {
      api: api,
      description: "Initial deployment",
    });

    const restApiStageLogGroup = new logs.LogGroup(
      this,
      "my-rest-api-stage-log-group"
    );

    // Create "dev" Stage
    const stage = new apigwv.Stage(this, "my-rest-api-stage", {
      deployment: deployment,
      stageName: "dev",
      variables: {},
      accessLogDestination: new apigwv.LogGroupLogDestination(
        restApiStageLogGroup
      ),
      accessLogFormat: apigwv.AccessLogFormat.jsonWithStandardFields({
        caller: false,
        httpMethod: true,
        ip: true,
        protocol: true,
        requestTime: true,
        resourcePath: true,
        responseLength: true,
        status: true,
        user: true,
      }),
    });

    // Associate the "dev" Stage with the API Gateway
    api.deploymentStage = stage;

    // Request and Response Models
    const userModel: apigwv.Model = api.addModel("UserResponseModel", {
      contentType: "application/json",
      modelName: "UserResponseModel",
      schema: {
        type: apigwv.JsonSchemaType.OBJECT,
        properties: {
          itemId: { type: apigwv.JsonSchemaType.STRING },
          email: { type: apigwv.JsonSchemaType.STRING },
          username: { type: apigwv.JsonSchemaType.STRING },
          password: { type: apigwv.JsonSchemaType.STRING },
          name: {
            type: apigwv.JsonSchemaType.OBJECT,
            properties: {
              firstname: { type: apigwv.JsonSchemaType.STRING },
              lastname: { type: apigwv.JsonSchemaType.STRING },
            },
          },
          address: {
            type: apigwv.JsonSchemaType.OBJECT,
            properties: {
              street: { type: apigwv.JsonSchemaType.STRING },
              zipcode: { type: apigwv.JsonSchemaType.STRING },
              city: { type: apigwv.JsonSchemaType.STRING },
            },
          },
          phone: { type: apigwv.JsonSchemaType.STRING },
        },
        required: ["itemId"],
      },
    });

    // Configure validators
    const requestValidator = new apigwv.RequestValidator(
      this,
      "my-rest-api-request-validator",
      {
        restApi: api,
        requestValidatorName: "my-rest-api-request-validator",
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    // Create Routes, Methods, and attach an integration
    /**  CREATE RESOURCES */
    // for -Items
    const items = api.root.addResource("items", {});

    // for -Item
    const item = items.addResource("{id}", {});

    /**  CREATE METHODS */
    //  for - Items
    items.addMethod(apigwv2.HttpMethod.GET, integration, {
      requestValidator: requestValidator,
    });

    items.addMethod(apigwv2.HttpMethod.POST, integration, {
      requestModels: {
        "application/json": userModel,
      },
      requestValidator: requestValidator,
    });

    // for - Item
    item.addMethod(apigwv2.HttpMethod.GET, integration, {
      requestValidator: requestValidator,
    });

    item.addMethod(apigwv2.HttpMethod.PUT, integration, {
      requestModels: {
        "application/json": userModel,
      },
      requestValidator: requestValidator,
    });

    item.addMethod(apigwv2.HttpMethod.DELETE, integration, {
      requestValidator: requestValidator,
    });

    this.restApi = api;
  }
}
