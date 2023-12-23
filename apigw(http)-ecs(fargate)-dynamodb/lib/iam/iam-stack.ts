import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

export class IamConfig extends Construct {
  public taskRole: iam.Role;
  public executionRole: iam.Role;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create ECS Task Role
    this.taskRole = new iam.Role(this, `${id}-task-role`, {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: `${id}-task-role`,
      description: "This is a Task Role for ECS",
    });

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

    this.executionRole = execRole;
  }
}
