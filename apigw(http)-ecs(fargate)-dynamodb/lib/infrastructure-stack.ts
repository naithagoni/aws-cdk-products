import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { HttpApiGatewayConfig } from "./api-gateway/http-api-gateway-stack";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const httpApiConfig = new HttpApiGatewayConfig(this, "my-http-api-gateway");

    // Http api url url
    new cdk.CfnOutput(this, "httpApiUrl", {
      value: httpApiConfig.stage.url,
      exportName: "httpApiUrl",
    });
  }
}
