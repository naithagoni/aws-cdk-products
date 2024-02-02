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
      endpointExportName: "my-rest-api-url",
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

    // Create Routes, Methods, and attach an integration
    /**  CREATE RESOURCES */
    // for -Items
    const items = api.root.addResource("items", {
      defaultCorsPreflightOptions: {
        allowCredentials: false,
        allowHeaders: ["*"],
        allowMethods: ["*"],
        allowOrigins: ["*"],
      },
    });

    // for -Item
    const item = items.addResource("{id}", {
      defaultCorsPreflightOptions: {
        allowCredentials: false,
        allowHeaders: apigwv.Cors.DEFAULT_HEADERS,
        allowMethods: apigwv.Cors.ALL_METHODS,
        allowOrigins: apigwv.Cors.ALL_ORIGINS,
      },
    });

    /**  CREATE METHODS */
    //  for - Items
    items.addMethod(
      apigwv2.HttpMethod.GET,
      // 2. Integration Request
      new apigwv.Integration({
        type: apigwv.IntegrationType.HTTP,
        integrationHttpMethod: apigwv2.HttpMethod.GET,
        uri: `http://${fargateConfig.fargateService.loadBalancer.loadBalancerDnsName}/items`,
        options: {
          passthroughBehavior: apigwv.PassthroughBehavior.WHEN_NO_MATCH,
          // 3. Integration Response
          // Mapping templates
          requestTemplates: {
            "application/json": "{ }",
          },
          integrationResponses: [
            {
              statusCode: "200",
            },
          ],
        },
      }),
      {
        // 4. Method Response
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {},
            // Response Body
            responseModels: {
              "application/json": userModel,
            },
          },
        ],
        // 1. Method Request
        operationName: "GET Items",
        authorizationType: apigwv.AuthorizationType.NONE,
        apiKeyRequired: false,
        requestValidatorOptions: {
          validateRequestBody: false,
          validateRequestParameters: true,
        },
      }
    );

    items.addMethod(
      apigwv2.HttpMethod.POST,
      // 2. Integration Request
      new apigwv.Integration({
        type: apigwv.IntegrationType.HTTP,
        integrationHttpMethod: apigwv2.HttpMethod.POST,
        uri: `http://${fargateConfig.fargateService.loadBalancer.loadBalancerDnsName}/items`,
        options: {
          passthroughBehavior: apigwv.PassthroughBehavior.WHEN_NO_MATCH,
          // 3. Integration Response
          // Mapping templates
          requestTemplates: {
            "application/json": "{ }",
          },
          integrationResponses: [
            {
              statusCode: "201",
            },
          ],
        },
      }),
      {
        // 4. Method Response
        methodResponses: [
          {
            statusCode: "201",
            responseParameters: {},
            responseModels: {
              "application/json": userModel,
            },
          },
        ],
        // 1. Method Request
        //? The models which describe data structure of request payload.
        requestModels: {
          "application/json": userModel,
        },
        operationName: "POST Item",
        authorizationType: apigwv.AuthorizationType.NONE,
        apiKeyRequired: false,
        requestValidatorOptions: {
          validateRequestBody: true,
          validateRequestParameters: true,
        },
      }
    );

    // for - Item
    item.addMethod(
      apigwv2.HttpMethod.GET,
      // 2. Integration Request
      new apigwv.Integration({
        type: apigwv.IntegrationType.HTTP,
        integrationHttpMethod: apigwv2.HttpMethod.GET,
        uri: `http://${fargateConfig.fargateService.loadBalancer.loadBalancerDnsName}/items/{id}`,
        options: {
          passthroughBehavior: apigwv.PassthroughBehavior.WHEN_NO_MATCH,
          requestParameters: {
            //! if you use id/itemId in your path, then you have to map your params
            ["integration.request.path.id"]: "method.request.path.id",
          },
          // 3. Integration Response
          // Mapping templates
          requestTemplates: {
            "application/json": "{ }",
          },
          integrationResponses: [
            {
              statusCode: "200",
            },
          ],
        },
      }),
      {
        // 4. Method Response
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {},
            responseModels: {
              "application/json": userModel,
            },
          },
        ],
        // 1. Method Request
        operationName: "GET Item",
        authorizationType: apigwv.AuthorizationType.NONE,
        apiKeyRequired: false,
        requestParameters: {
          ["method.request.path.id"]: true,
        },
        requestValidatorOptions: {
          validateRequestBody: false,
          validateRequestParameters: true,
        },
      }
    );

    item.addMethod(
      apigwv2.HttpMethod.PUT,
      // 2. Integration Request
      new apigwv.Integration({
        type: apigwv.IntegrationType.HTTP,
        integrationHttpMethod: apigwv2.HttpMethod.PUT,
        uri: `http://${fargateConfig.fargateService.loadBalancer.loadBalancerDnsName}/items/{id}`,
        options: {
          passthroughBehavior: apigwv.PassthroughBehavior.WHEN_NO_MATCH,
          requestParameters: {
            //! if you use itemId in your path, then you have to map your params
            ["integration.request.path.id"]: "method.request.path.id",
          },
          // 3. Integration Response
          // Mapping templates
          requestTemplates: {
            "application/json": "{ }",
          },
          integrationResponses: [
            {
              statusCode: "201",
            },
          ],
        },
      }),
      {
        // 4. Method Response
        methodResponses: [
          {
            statusCode: "201",
            responseParameters: {},
            responseModels: {
              "application/json": userModel,
            },
          },
        ],
        // 1. Method Request
        requestModels: {
          "application/json": userModel,
        },
        operationName: "PUT Item",
        authorizationType: apigwv.AuthorizationType.NONE,
        apiKeyRequired: false,
        requestParameters: {
          ["method.request.path.id"]: true,
        },
        requestValidatorOptions: {
          validateRequestBody: true,
          validateRequestParameters: true,
        },
      }
    );

    item.addMethod(
      apigwv2.HttpMethod.DELETE,
      // 2. Integration Request
      new apigwv.Integration({
        type: apigwv.IntegrationType.HTTP,
        integrationHttpMethod: apigwv2.HttpMethod.DELETE,
        uri: `http://${fargateConfig.fargateService.loadBalancer.loadBalancerDnsName}/items/{id}`,
        options: {
          passthroughBehavior: apigwv.PassthroughBehavior.WHEN_NO_MATCH,
          requestParameters: {
            //! if you use itemId in your path, then you have to map your params
            ["integration.request.path.id"]: "method.request.path.id",
          },
          // 3. Integration Response
          // Mapping templates
          requestTemplates: {
            "application/json": "{}",
          },
          integrationResponses: [
            {
              statusCode: "200",
            },
          ],
        },
      }),
      {
        // 4. Method Response
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {},
            responseModels: {
              "application/json": userModel,
            },
          },
        ],
        // 1. Method Request
        operationName: "DELETE Item",
        authorizationType: apigwv.AuthorizationType.NONE,
        apiKeyRequired: false,
        requestParameters: {
          ["method.request.path.id"]: true,
        },
        requestValidatorOptions: {
          validateRequestBody: false,
          validateRequestParameters: true,
        },
      }
    );

    this.restApi = api;
  }
}
