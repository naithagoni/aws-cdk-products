// import * as cdk from "aws-cdk-lib";
// import { Construct } from "constructs";
// import * as aws_apigateway from "aws-cdk-lib/aws-apigateway";

// export class RestApiGatewayService extends Construct {
//   constructor(scope: Construct, id: string) {
//     super(scope, id);

//     // Get the stack of the construct
//     const stack = cdk.Stack.of(scope);
//     // Importing ALB domain name
//     const loadBalancerDnsName = cdk.Fn.importValue("loadBalancerUrl");

//     // const fargateALBService = new FargateALBService(this, 'FargateALBService');

//     // Create a VPC Link for the API Gateway
//     // const vpcLink = new aws_apigateway.VpcLink(this, "MyVpcLink", {
//     //   targets: [vpc],
//     // });

//     // Create API Gateway
//     const restApi = new aws_apigateway.RestApi(this, "ProductsRestApi");

//     // Create an API Gateway
//     // const api = new aws_apigateway.RestApi(this, "MyApi", {
//     //   defaultIntegration: new aws_apigateway_integrations.HttpProxyIntegration({
//     //     // Use ALB DNS name from FargateALBConstructService
//     //     url: `http://${loadBalancerDnsName}`,
//     //   }),
//     // });

//     // Request and Response Models
//     const productModel = restApi.addModel("ProductModel", {
//       schema: {
//         type: aws_apigateway.JsonSchemaType.OBJECT,
//         properties: {
//           itemId: { type: aws_apigateway.JsonSchemaType.INTEGER },
//           name: { type: aws_apigateway.JsonSchemaType.STRING },
//           price: { type: aws_apigateway.JsonSchemaType.NUMBER },
//           color: { type: aws_apigateway.JsonSchemaType.STRING },
//         },
//       },
//     });

//     // Create API Gateway Deployment
//     const apiGatewaydeployment = new aws_apigateway.Deployment(
//       this,
//       "rest-api-crud-deployment",
//       {
//         api: restApi,
//         description: "Initial deployment",
//       }
//     );

//     // Create "dev" Stage
//     const stage = new aws_apigateway.Stage(this, "ProductsStage", {
//       deployment: apiGatewaydeployment,
//       stageName: "dev",
//       variables: {
//         REGION: stack.region, // Set REGION environment variable for the stage
//       },
//     });

//     // Associate the "dev" Stage with the API Gateway
//     restApi.deploymentStage = stage;

//     // Configure validators
//     const requestValidator = restApi.addRequestValidator(
//       "ProductRequestValidator",
//       {
//         validateRequestParameters: true,
//         validateRequestBody: true,
//       }
//     );

//     // Add Resources
//     const items = restApi.root.addResource("items");
//     const item = items.addResource("{id}");

//     // Define an Integration
//     const integration = new aws_apigateway.AwsIntegration({
//       service: loadBalancerDnsName,
//       action: "ModifyListener",
//       options: {
//         requestParameters: {
//           "integration.request.header.Host": "method.request.header.Host",
//           "integration.request.header.X-Forwarded-Proto":
//             "method.request.header.X-Forwarded-Proto",
//           "integration.request.header.X-Forwarded-Port":
//             "method.request.header.X-Forwarded-Port",
//           "integration.request.header.X-Forwarded-For":
//             "method.request.header.X-Forwarded-For",
//         },
//         passthroughBehavior:
//           aws_apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
//         requestTemplates: {
//           "application/json": '{ "statusCode": "200" }', // Define your request template here
//         },
//         integrationResponses: [
//           {
//             statusCode: "200",
//             responseTemplates: {
//               "application/json": `$input.path('$')`, // Set the response template here
//             },
//           },
//         ],
//       },
//     });

//     const integrationOptions = (code: string): aws_apigateway.MethodOptions => {
//       return {
//         methodResponses: [
//           {
//             statusCode: code,
//             responseModels: { "application/json": productModel },
//           },
//         ],
//         requestModels: {
//           "application/json": productModel,
//         },
//         requestValidator: requestValidator,
//       };
//     };

//     // GET /items/health
//     items.addMethod("GET", integration);

//     // GET /items
//     items.addMethod("GET", integration, integrationOptions("200"));

//     // PUT /items
//     items.addMethod("PUT", integration, integrationOptions("201"));

//     // GET /items/{id}
//     item.addMethod("GET", integration, integrationOptions("200"));

//     // PUT /items/{id}
//     item.addMethod("PUT", integration, integrationOptions("201"));

//     // DELETE /items/{id}
//     item.addMethod("DELETE", integration, integrationOptions("200"));

//     // Output the URL of the API Gateway
//     new cdk.CfnOutput(this, "apiGatewayURL", {
//       value: restApi.url,
//       exportName: "apiGatewayURL",
//     });
//   }
// }
