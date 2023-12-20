import { Construct } from "constructs";
import * as aws_dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as aws_iam from "aws-cdk-lib/aws-iam";

export class DynamoDbService extends Construct {
  public dyTable;
  public iamRole;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create DynamoDB table
    this.dyTable = new aws_dynamodb.Table(this, "ProductsDb", {
      partitionKey: { name: "itemId", type: aws_dynamodb.AttributeType.STRING },
    });

    const iamPolicy = new aws_iam.Policy(this, "ProductsTaskPolicy", {
      statements: [
        new aws_iam.PolicyStatement({
          actions: [
            "dynamodb:CreateTable",
            "dynamodb:GetItem",
            "dynamodb:PutItem",
          ],
          effect: aws_iam.Effect.ALLOW,
          resources: [this.dyTable.tableArn],
        }),
      ],
    });

    // Create a ProductsTaskRole with minimal permissions for DynamoDB
    this.iamRole = new aws_iam.Role(this, "ProductsTaskRole", {
      assumedBy: new aws_iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    this.iamRole.attachInlinePolicy(iamPolicy);

    // Attach DynamoDB read and write permissions to the task role
    this.dyTable.grantReadWriteData(this.iamRole);
  }
}
