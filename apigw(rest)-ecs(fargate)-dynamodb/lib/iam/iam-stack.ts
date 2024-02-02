import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export class IamConfig extends Construct {
  public taskRole: iam.Role;
  public executionRole: iam.Role;
  public apiGatewayRole: iam.Role;

  constructor(scope: Construct, id: string, dyTableArn: string) {
    super(scope, id);

    const dyPolicy = new iam.Policy(this, `${id}-task-role-policy`, {
      policyName: `${id}-task-role-policy`,
      statements: [
        new iam.PolicyStatement({
          actions: [
            "dynamodb:List*",
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:DescribeTable",
            "dynamodb:UpdateTable",
            "dynamodb:Query",
            "dynamodb:Scan",
          ],
          effect: iam.Effect.ALLOW,
          resources: [dyTableArn],
        }),
      ],
    });

    // Create ECS Task Role
    this.taskRole = new iam.Role(this, `${id}-task-role`, {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `${id}-task-role`,
      description: "This is a Task Role for ECS",
    });

    // Attach required permissions to Fargate to operate/access dynamoDB
    this.taskRole.attachInlinePolicy(dyPolicy);

    // Create ECS Execution Role
    const execRole = new iam.Role(this, `${id}-execution-role`, {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `${id}-execution-role`,
      description: "This is a Execution Role for ECS",
    });

    execRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        // ? Some managed policy names start with "service-role/", some start with "job-function/", and some don't start with anything. Do include the prefix when constructing this object.
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );

    // // Create a custom IAM role for API Gateway
    // const apiGateRole = new iam.Role(this, "ApiGatewayCloudWatchLogsRole", {
    //   assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    // });

    // // Attach an existing inline policy to the IAM role
    // apiGateRole.addManagedPolicy(
    //   iam.ManagedPolicy.fromAwsManagedPolicyName(
    //     "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
    //   )
    // );

    this.executionRole = execRole;
    // this.apiGatewayRole = apiGateRole;
  }
}
