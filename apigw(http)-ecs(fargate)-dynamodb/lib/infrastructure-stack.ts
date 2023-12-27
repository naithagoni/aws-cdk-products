import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { HttpApiGatewayConfig } from "./api-gateway/http-api-gateway-stack";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const httpApiConfig = new HttpApiGatewayConfig(this, "my-http-api-gateway");

    // Output Http api url
    new cdk.CfnOutput(this, "httpApiUrl", {
      value: httpApiConfig.httpApi.apiEndpoint,
      exportName: "httpApiUrl",
    });
  }
}
