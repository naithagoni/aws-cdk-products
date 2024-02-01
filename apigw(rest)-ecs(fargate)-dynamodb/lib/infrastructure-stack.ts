import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { RestApiGatewayConfig } from "./api-gateway/rest-api-gateway-stack";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const httpApiConfig = new RestApiGatewayConfig(this, "my-rest-api-gateway");

    // Output Http api url
    new cdk.CfnOutput(this, "restApiUrl", {
      value: httpApiConfig.restApi.url,
      exportName: "restApiUrl",
    });
  }
}
