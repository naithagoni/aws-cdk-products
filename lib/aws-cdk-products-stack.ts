import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as aws_dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as aws_iam from "aws-cdk-lib/aws-iam";
import * as aws_lambda from "aws-cdk-lib/aws-lambda";
import * as aws_lambda_nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as aws_apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class AwsCdkProductsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //? The code that defines your stack goes here

    // Create DynamoDB table
    const table = new aws_dynamodb.Table(this, "rest-api-crud-db", {
      partitionKey: { name: "itemId", type: aws_dynamodb.AttributeType.STRING },
    });

    // Create an IAM role for Lambda
    const lambdaRole = new aws_iam.Role(this, "rest-api-crud-role", {
      assumedBy: new aws_iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    // Attach policies to lambdaRole for DynamoDB access
    lambdaRole.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query",
        ],
        resources: [table.tableArn],
      })
    );

    // Lambda function
    const lambdaFn = new aws_lambda_nodejs.NodejsFunction(
      this,
      "rest-api-crud-function",
      {
        entry: path.join(__dirname, "api-service"), // Folder containing your Lambda function code
        handler: "app", // Name of the Lambda handler function
        runtime: aws_lambda.Runtime.NODEJS_18_X,
        environment: {
          TABLE_NAME: table.tableName,
          REGION: this.region,
        },
        role: lambdaRole,
      }
    );

    // Create API Gateway
    const restApi = new aws_apigateway.RestApi(this, "rest-api-crud-api");

    // Request and Response Models
    const productModel = restApi.addModel("ProductModel", {
      schema: {
        type: aws_apigateway.JsonSchemaType.OBJECT,
        properties: {
          itemId: { type: aws_apigateway.JsonSchemaType.INTEGER },
          name: { type: aws_apigateway.JsonSchemaType.STRING },
          price: { type: aws_apigateway.JsonSchemaType.NUMBER },
          color: { type: aws_apigateway.JsonSchemaType.STRING },
        },
      },
    });

    // Create API Gateway Deployment
    const apiGatewaydeployment = new aws_apigateway.Deployment(
      this,
      "rest-api-crud-deployment",
      {
        api: restApi,
        description: "Initial deployment",
      }
    );

    // Create "dev" Stage
    const stage = new aws_apigateway.Stage(this, "dev", {
      deployment: apiGatewaydeployment,
      stageName: "dev",
      variables: {
        REGION: this.region, // Set REGION environment variable for the stage
      },
    });

    // Associate the "dev" Stage with the API Gateway
    restApi.deploymentStage = stage;

    // Request Validator
    const requestValidator = restApi.addRequestValidator(
      "ProductRequestValidator",
      {
        validateRequestParameters: true,
        validateRequestBody: true,
      }
    );

    // Add Resources
    const items = restApi.root.addResource("items");
    const health = items.addResource("health");
    const item = items.addResource("{id}");

    // Lambda integration
    const integration = new aws_apigateway.LambdaIntegration(lambdaFn, {
      requestTemplates: {
        "application/json": '$input.json("$")',
      },
      proxy: false,
      allowTestInvoke: true,
    });

    const integrationOptions = (code: string): aws_apigateway.MethodOptions => {
      return {
        methodResponses: [
          {
            statusCode: code,
            responseModels: { "application/json": productModel },
          },
        ],
        requestModels: {
          "application/json": productModel,
        },
        requestValidator: requestValidator,
      };
    };

    // GET /items/health
    items.addMethod("GET", integration);

    // GET /items
    items.addMethod("GET", integration, integrationOptions("200"));

    // PUT /items
    items.addMethod("PUT", integration, integrationOptions("201"));

    // GET /items/{id}
    item.addMethod("GET", integration, integrationOptions("200"));

    // PUT /items/{id}
    item.addMethod("PUT", integration, integrationOptions("201"));

    // DELETE /items/{id}
    item.addMethod("DELETE", integration, integrationOptions("200"));

    new cdk.CfnOutput(this, "ApiURL", {
      value: restApi.url,
    });
  }
}
