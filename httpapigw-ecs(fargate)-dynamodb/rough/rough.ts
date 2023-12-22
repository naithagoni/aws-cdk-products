import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as aws_dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as aws_iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
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
    /**
     * TODOs
     *  PART-1:
     * 1. Create 2 public and private subnets -> place 1 public and 1 private in us-east-1a region and 1 public and 1 private in us-east-1b region -> CIDR: 10.0.0.0/16
     * 2. Create an InternetGateway.
     * 3. Create an NatGateway.
     * 4. Create an Elastic IP Address (@see images in images directory)
     * 5. Create route tables and Associate natgateways to privateSubnets as target and internetgateways to publicSubnets as target.
     *  PART-2:
     * 6. Create a Security group.
     * 7. Create a Load balancer with type 'Application Load Balancer' and 2 public subnets (@see images). and add a Listener.
     * 8. Create a Target group with type IP and register targets with PrivateSubnet1 and PrivateSubnet2 --> "Primary Private IPv4 address(you get it from Network interfaces)".
     */
    const vpc = new ec2.Vpc(this, "my-vpc", {
      vpcName: "my-vpc",
      cidr: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
      availabilityZones: ["us-east-1a", "us-east-1b"], // OR maxAzs: 2,
      createInternetGateway: true, // TODO: Test
      subnetConfiguration: [
        {
          cidrMask: 20,
          subnetType: ec2.SubnetType.PUBLIC,
          name: "my-public-subnet1",
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 20,
          subnetType: ec2.SubnetType.PUBLIC,
          name: "my-public-subnet2",
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 20,
          name: "my-private-subnet1",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 20,
          name: "my-private-subnet2",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Access individual subnets
    const publicSubnet1 = vpc.publicSubnets[0];
    const publicSubnet2 = vpc.publicSubnets[1];
    const privateSubnet1 = vpc.privateSubnets[0];
    const privateSubnet2 = vpc.privateSubnets[1];

    // Create Network ACL
    const networkAcl = new ec2.NetworkAcl(this, "my-network-acl", {
      vpc: vpc,
      networkAclName: "my-network-acl",
    });

    // Add Inbound Rule to Network ACL (Traffic entering the subnet)
    const networkAclInbound = new ec2.NetworkAclEntry(
      this,
      "my-network-acl-inbound",
      {
        networkAcl: networkAcl,
        networkAclEntryName: "my-network-acl-inbound-rule",
        // The CIDR containing all IPv4 addresses (i.e., 0.0.0.0/0)
        cidr: ec2.AclCidr.anyIpv4(),
        // Apply the ACL entry to all traffic
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.ALLOW,
        ruleNumber: 100,
      }
    );

    // Add Inbound Rule to Network ACL (Traffic leaving the subnet)
    const networkAclOutbound = new ec2.NetworkAclEntry(
      this,
      "my-network-acl-outbound",
      {
        networkAcl: networkAcl,
        networkAclEntryName: "my-network-acl-outbound-rule",
        // The CIDR containing all IPv4 addresses (i.e., 0.0.0.0/0)
        cidr: ec2.AclCidr.anyIpv4(),
        // Apply the ACL entry to all traffic
        traffic: ec2.AclTraffic.allTraffic(),
        direction: ec2.TrafficDirection.EGRESS,
        ruleAction: ec2.Action.ALLOW,
        ruleNumber: 100,
      }
    );

    /** Associate subnets to Network Acl  */
    const associatePubSub1ToNetAcl = new ec2.SubnetNetworkAclAssociation(
      this,
      "my-public-subnet1-network-acl-association",
      {
        subnetNetworkAclAssociationName:
          "my-public-subnet1-network-acl-association",
        networkAcl: networkAcl,
        subnet: publicSubnet1,
      }
    );
    const associatePubSub2ToNetAcl = new ec2.SubnetNetworkAclAssociation(
      this,
      "my-public-subnet2-network-acl-association",
      {
        subnetNetworkAclAssociationName:
          "my-public-subnet1-network-acl-association",
        networkAcl: networkAcl,
        subnet: publicSubnet2,
      }
    );
    const associatePriSub1ToNetAcl = new ec2.SubnetNetworkAclAssociation(
      this,
      "my-private-subnet1-network-acl-association",
      {
        subnetNetworkAclAssociationName:
          "my-private-subnet1-network-acl-association",
        networkAcl: networkAcl,
        subnet: privateSubnet1,
      }
    );
    const associatePriSub2ToNetAcl = new ec2.SubnetNetworkAclAssociation(
      this,
      "my-private-subnet2-network-acl-association",
      {
        subnetNetworkAclAssociationName:
          "my-private-subnet2-network-acl-association",
        networkAcl: networkAcl,
        subnet: privateSubnet2,
      }
    );

    // Create Elastic IPs for public subnets
    const myEIP = new ec2.CfnEIP(this, "my-EIP", {
      domain: "vpc",
      networkBorderGroup: "us-east-1",
    });

    // NAT Gateways for public subnet 1
    const natGateway1 = new ec2.CfnNatGateway(
      this,
      "my-public-subnet1-nat-gateway",
      {
        allocationId: myEIP.attrAllocationId,
        connectivityType: "public",
        subnetId: publicSubnet1.subnetId,
      }
    );

    const natGateway2 = new ec2.CfnNatGateway(
      this,
      "my-public-subnet2-nat-gateway",
      {
        allocationId: myEIP.attrAllocationId,
        connectivityType: "public",
        subnetId: publicSubnet2.subnetId,
      }
    );

    // Create Internet Gateway
    const internetGateway = new ec2.CfnInternetGateway(
      this,
      "my-internet-gateway",
      {
        tags: [],
      }
    );

    // Attach Internet Gateway to VPC
    const vpcGatewayAttachment = new ec2.CfnVPCGatewayAttachment(
      this,
      "attach-internet-gateway-to-vpc",
      {
        vpcId: vpc.vpcId,
        internetGatewayId: internetGateway.attrInternetGatewayId,
      }
    );

    /** PUBLIC SUBNET 1 CONFIGURATION */
    // Create a route table
    const pubSub1RouteTable = new ec2.CfnRouteTable(
      this,
      "my-pub-sub1-route-table",
      {
        vpcId: vpc.vpcId,
      }
    );

    // Create a Route
    const publicSubnet1Route = new ec2.CfnRoute(this, "my-pub-sub1-route", {
      routeTableId: pubSub1RouteTable.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: vpc.internetGatewayId,
    });

    // Associate a subnet
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "associate-pub-sub1-to-route-table",
      {
        routeTableId: pubSub1RouteTable.attrRouteTableId,
        subnetId: publicSubnet1.subnetId,
      }
    );

    /** PUBLIC SUBNET 2 CONFIGURATION */
    // Create a route table
    const pubSub2RouteTable = new ec2.CfnRouteTable(
      this,
      "my-pub-sub2-route-table",
      {
        vpcId: vpc.vpcId,
      }
    );

    // Create a Route
    const publicSubnet2Route = new ec2.CfnRoute(this, "my-pub-sub2-route", {
      routeTableId: pubSub2RouteTable.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: vpc.internetGatewayId,
    });

    // Associate a subnet
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "associate-pub-sub2-to-route-table",
      {
        routeTableId: pubSub2RouteTable.attrRouteTableId,
        subnetId: publicSubnet2.subnetId,
      }
    );

    /** PRIVATE SUBNET 1 CONFIGURATION */
    // Create a route table
    const priSub1RouteTable = new ec2.CfnRouteTable(
      this,
      "my-pri-sub1-route-table",
      {
        vpcId: vpc.vpcId,
      }
    );

    // Create a Route
    const privateSubnet1Route = new ec2.CfnRoute(this, "my-pri-sub1-route", {
      routeTableId: priSub1RouteTable.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway1.attrNatGatewayId,
    });

    // Associate a subnet
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "associate-pri-sub1-to-route-table",
      {
        routeTableId: priSub1RouteTable.attrRouteTableId,
        subnetId: privateSubnet1.subnetId,
      }
    );

    /** PRIVATE SUBNET 2 CONFIGURATION */
    // Create a route table
    const priSub2RouteTable = new ec2.CfnRouteTable(
      this,
      "my-pri-sub2-route-table",
      {
        vpcId: vpc.vpcId,
      }
    );

    // Create a Route
    const privateSubnet2Route = new ec2.CfnRoute(this, "my-pri-sub2-route", {
      routeTableId: priSub2RouteTable.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway2.attrNatGatewayId,
    });

    // Associate a private subnet 2 to a route table
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "associate-pri-sub2-to-route-table",
      {
        routeTableId: priSub2RouteTable.attrRouteTableId,
        subnetId: privateSubnet2.subnetId,
      }
    );

    // Create a SG
    const securityGroup = new ec2.SecurityGroup(this, "my-security-group", {
      securityGroupName: "my-security-group",
      vpc,
      allowAllOutbound: true,
      description: "security group",
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      /**
       * To, allow SSH access from anyhwere -> ec2.Port.tcp(22).
       * To, allow HTTP traffic from anyhwere -> ec2.Port.tcp(80).
       * To, allow HTTPS traffic from anyhwere -> ec2.Port.tcp(443).
       * To, allow ICMP traffic from a specific IP range -> ec2.Peer.ipv4('123.123.123.123/16'), ec2.Port.allIcmp().
       */
      ec2.Port.allTraffic(),
      "allow traffic from anyhwere"
    );

    securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
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
          path: "/health",
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
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
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
