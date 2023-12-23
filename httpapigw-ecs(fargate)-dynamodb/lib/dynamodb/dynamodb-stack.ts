import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";

export class DynamoDbConfig extends Construct {
  public dyTable;
  public iamRole;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create DynamoDB table
    this.dyTable = new dynamodb.Table(this, id, {
      tableName: `${id}-table`,
      partitionKey: { name: "itemId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const iamPolicy = new iam.Policy(this, "my-task-role-policy", {
      policyName: "my-task-role-policy",
      statements: [
        new iam.PolicyStatement({
          actions: [
            "dynamodb:CreateTable",
            "dynamodb:GetItem",
            "dynamodb:PutItem",
          ],
          effect: iam.Effect.ALLOW,
          resources: [this.dyTable.tableArn],
        }),
      ],
    });

    // Create a ProductsTaskRole with minimal permissions for DynamoDB
    this.iamRole = new iam.Role(this, "my-task-role", {
      roleName: "my-task-role",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    this.iamRole.attachInlinePolicy(iamPolicy);

    // Attach DynamoDB read and write permissions to the task role
    this.dyTable.grantReadWriteData(this.iamRole);
  }
}
