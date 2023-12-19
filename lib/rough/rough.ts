import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as aws_dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as aws_iam from "aws-cdk-lib/aws-iam";
import * as aws_ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as path from "path";
import * as aws_ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as apigateway2 from "aws-cdk-lib/aws-apigatewayv2";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table
    const dyTable = new aws_dynamodb.Table(this, "my-dynamodb-table", {
      partitionKey: { name: "itemId", type: aws_dynamodb.AttributeType.STRING },
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create VPC
    // NOTE: Limit AZs to avoid reaching resource quotas
    const vpc = new aws_ec2.Vpc(this, "my-vpc", {
      maxAzs: 2, // Specify the number of Availability Zones you need
    });

    // Create a SG
    const securityGroup = new aws_ec2.SecurityGroup(this, "my-security-group", {
      securityGroupName: "my-security-group",
      vpc,
      allowAllOutbound: true,
      description: "security group",
    });

    securityGroup.addIngressRule(
      aws_ec2.Peer.anyIpv4(),
      /**
       * To, allow SSH access from anyhwere -> ec2.Port.tcp(22).
       * To, allow HTTP traffic from anyhwere -> ec2.Port.tcp(80).
       * To, allow HTTPS traffic from anyhwere -> ec2.Port.tcp(443).
       * To, allow ICMP traffic from a specific IP range -> ec2.Peer.ipv4('123.123.123.123/16'), ec2.Port.allIcmp().
       */
      aws_ec2.Port.allTraffic(),
      "allow traffic from anyhwere"
    );

    securityGroup.addEgressRule(
      aws_ec2.Peer.anyIpv4(),
      aws_ec2.Port.allTraffic(),
      "allow outgoing traffic to anywhere"
    );

    // Create a Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "my-ip-target-group",
      {
        targetType: elbv2.TargetType.IP,
        targetGroupName: "my-ip-target-group",
        protocol: elbv2.ApplicationProtocol.HTTP,
        port: 80,
        vpc: vpc,
        protocolVersion: elbv2.ApplicationProtocolVersion.HTTP1,
        healthCheck: {
          enabled: true,
          protocol: elbv2.Protocol.HTTP,
          path: "/",
          // The port the load balancer uses when performing health checks on targets.
          // By default, the health check port is the same as the target group's traffic port
          port: "traffic-port",
        },
      }
    );

    // Create an Application Load Balancer(ALB)
    const alb = new elbv2.ApplicationLoadBalancer(this, "my-alb", {
      loadBalancerName: "my-alb",
      vpc,
      internetFacing: true, // internal
      vpcSubnets: {
        subnets: [...vpc.publicSubnets],
      },
      deletionProtection: false,
      securityGroup,
      ipAddressType: elbv2.IpAddressType.IPV4,
    });

    // Add a listener to an ALB
    alb.addListener("my-alb-listener", {
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 80,
      open: true,
      // The default action specifies the default rule for routing requests.
      defaultAction: elbv2.ListenerAction.forward([targetGroup]),
    });

    // VPC Dynamo Endpoint
    const dynamoGatewayEndpoint = vpc.addGatewayEndpoint(
      "my-dynamo-gateway-endpoint",
      {
        service: aws_ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      }
    );

    // Create ECS cluster
    const cluster = new aws_ecs.Cluster(this, "my-cluster", {
      vpc: vpc,
    });

    // Create an ECS Fargate service
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "my-fargate-service",
        {
          cluster: cluster,
          cpu: 512,
          memoryLimitMiB: 2048,
          desiredCount: 1,
          assignPublicIp: false,
          publicLoadBalancer: false,
          taskImageOptions: {
            image: aws_ecs.ContainerImage.fromAsset(
              path.join(__dirname, "../api-service/")
            ),
            containerName: "my-container",
            containerPort: 80,
            logDriver: aws_ecs.LogDrivers.awsLogs({
              streamPrefix: "my-container-log",
            }),
            environment: {
              DYNAMO_TABLE_NAME: dyTable.tableName,
              REGION: process.env.CDK_DEFAULT_REGION!,
            },
          },
        }
      );

    // Allow PutItem action from the Fargate Task Definition only
    dynamoGatewayEndpoint.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        principals: [new aws_iam.AnyPrincipal()],
        actions: [
          "dynamodb:List*",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:DescribeTable",
          "dynamodb:UpdateTable",
          "dynamodb:Scan",
          "dynamodb:DescribeStream",
          "dynamodb:GetRecords",
          "cloudwatch:DeleteInsightRules",
          "cloudwatch:PutInsightRule",
        ],
        resources: [`${dyTable.tableArn}`],
        conditions: {
          ArnEquals: {
            "aws:PrincipalArn": `${fargateService.taskDefinition.taskRole.roleArn}`,
          },
        },
      })
    );

    // Write permissions for Fargate
    dyTable.grantWriteData(fargateService.taskDefinition.taskRole);
    // Output DynamoDB table name
    new cdk.CfnOutput(this, "DynamoDbTableName", { value: dyTable.tableName });

    // Create VPC Link for REST APIs
    // const vpcLink = new apigateway.VpcLink(this, "my-vpcLink", {
    //   vpcLinkName: "my-vpc-link",
    //   description: "VPC Link is created for REST APIs",
    //   targets: [nlb],
    // });

    // Create API Gateway
    const restApi = new apigateway.RestApi(this, "ProductsRestApi", {
      endpointConfiguration: { types: [apigateway2.EndpointType.REGIONAL] },
    });

    // Request and Response Models
    const productModel = restApi.addModel("ProductModel", {
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        properties: {
          itemId: { type: apigateway.JsonSchemaType.INTEGER },
          name: { type: apigateway.JsonSchemaType.STRING },
          price: { type: apigateway.JsonSchemaType.NUMBER },
          color: { type: apigateway.JsonSchemaType.STRING },
        },
      },
    });

    // Create API Gateway Deployment
    const apiGatewaydeployment = new apigateway.Deployment(
      this,
      "rest-api-crud-deployment",
      {
        api: restApi,
        description: "Initial deployment",
      }
    );

    // Create "dev" Stage
    const stage = new apigateway.Stage(this, "ProductsStage", {
      deployment: apiGatewaydeployment,
      stageName: "dev",
      variables: {
        REGION: this.region, // Set REGION environment variable for the stage
      },
    });

    // Associate the "dev" Stage with the API Gateway
    restApi.deploymentStage = stage;

    // Configure validators
    const requestValidator = restApi.addRequestValidator(
      "ProductRequestValidator",
      {
        validateRequestParameters: true,
        validateRequestBody: true,
      }
    );

    // 2. Add Resources
    const items = restApi.root.addResource("items", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    const item = items.addResource("{id}", {
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Define an Integration
    const integration = new apigateway.AwsIntegration({
      service: "",
      action: "ModifyListener",
      region: this.region,
      options: {
        requestParameters: {
          "integration.request.header.Host": "method.request.header.Host",
          "integration.request.header.X-Forwarded-Proto":
            "method.request.header.X-Forwarded-Proto",
          "integration.request.header.X-Forwarded-Port":
            "method.request.header.X-Forwarded-Port",
          "integration.request.header.X-Forwarded-For":
            "method.request.header.X-Forwarded-For",
        },
        passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_TEMPLATES,
        requestTemplates: {
          "application/json": '{ "statusCode": "200" }', // Define your request template here
        },
        integrationResponses: [
          {
            statusCode: "200",
            responseTemplates: {
              "application/json": `$input.path('$')`, // Set the response template here
            },
          },
        ],
      },
    });

    const integrationOptions = (code: string): apigateway.MethodOptions => {
      return {
        methodResponses: [
          {
            statusCode: code,
            responseModels: { "application/json": productModel },
          },
        ],
        requestModels: {
          "application/json": productModel,
        },
        requestValidator: requestValidator,
      };
    };

    // 3. Create methods
    // GET /items/health
    items.addMethod("GET", integration);

    // GET /items
    items.addMethod("GET", integration, integrationOptions("200"));

    // PUT /items
    items.addMethod("PUT", integration, integrationOptions("201"));

    // GET /items/{id}
    item.addMethod("GET", integration, integrationOptions("200"));

    // PUT /items/{id}
    item.addMethod("PUT", integration, integrationOptions("201"));

    // DELETE /items/{id}
    item.addMethod("DELETE", integration, integrationOptions("200"));

    // Output the URL of the API Gateway
    new cdk.CfnOutput(this, "my-api-gateway-url", {
      value: restApi.url,
      exportName: "apiGatewayURL",
    });

    // Output the Load Balancer URL
    new cdk.CfnOutput(this, "my-load-balancer-url", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}
