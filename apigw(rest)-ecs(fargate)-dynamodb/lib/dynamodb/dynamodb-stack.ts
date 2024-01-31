import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class DynamoDbConfig extends Construct {
  public dyTable;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create DynamoDB table
    this.dyTable = new dynamodb.Table(this, id, {
      tableName: `${id}-table`,
      partitionKey: { name: "itemId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
