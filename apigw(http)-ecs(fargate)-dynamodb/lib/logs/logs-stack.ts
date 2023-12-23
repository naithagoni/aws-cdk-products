import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";

export class LogsConfig extends Construct {
  public logGroup: logs.LogGroup;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, id, {
      logGroupName: id,
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
