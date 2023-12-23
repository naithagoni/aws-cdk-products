import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as path from "path";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as api from "aws-cdk-lib/aws-apigateway";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //** VPC & SUBNET CONFIGURATION */
    // When using subnetConfiguration in the Vpc construct, the route table associations for subnets are automatically handled based on the specified subnetType.
    // For public subnets, the route table association is set to the main route table of the VPC, and for private subnets, it's associated with the route table created for the private subnet.
    // Create a VPC
    const vpc = new ec2.Vpc(this, "MyVPC", {
      cidr: "10.0.0.0/16", // --> 172.31.0.0/16
      maxAzs: 2, // OR availabilityZones: ["us-east-1a", "us-east-1b"],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      defaultInstanceTenancy: ec2.DefaultInstanceTenancy.DEFAULT,
      subnetConfiguration: [
        {
          cidrMask: 18,
          subnetType: ec2.SubnetType.PUBLIC,
          name: "PublicSubnet1",
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 18,
          subnetType: ec2.SubnetType.PUBLIC,
          name: "PublicSubnet2",
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 18,
          name: "PrivateSubnet1",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          mapPublicIpOnLaunch: false,
        },
        {
          cidrMask: 18,
          name: "PrivateSubnet2",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          mapPublicIpOnLaunch: false,
        },
      ],
    });

    //** ALTERNATIVE SUBNET CONFIGURATION */
    // Create a public subnet 1
    const publicSubnet1 = new ec2.PublicSubnet(this, "my-public-subnet1", {
      availabilityZone: "us-east-1a",
      vpcId: vpc.vpcId,
      cidrBlock: "172.31.50.0/24",
      mapPublicIpOnLaunch: true,
    });

    // Create a public subnet 2
    const publicSubnet2 = new ec2.PublicSubnet(this, "my-public-subnet2", {
      availabilityZone: "us-east-1b",
      vpcId: vpc.vpcId,
      cidrBlock: "172.31.51.0/24",
      mapPublicIpOnLaunch: true,
    });

    // Create a private subnet 1
    const privateSubnet1 = new ec2.PrivateSubnet(this, "my-private-subnet1", {
      availabilityZone: "us-east-1a",
      vpcId: vpc.vpcId,
      cidrBlock: "172.31.52.0/24",
    });

    // Create a private subnet 2
    const privateSubnet2 = new ec2.PrivateSubnet(this, "my-private-subnet2", {
      availabilityZone: "us-east-1b",
      vpcId: vpc.vpcId,
      cidrBlock: "172.31.53.0/24",
    });

    //** END OF ALTERNATIVE SUBNET CONFIGURATION */

    // // Access individual subnets
    // const publicSubnet1 = vpc.publicSubnets[0];
    // const publicSubnet2 = vpc.publicSubnets[1];
    // const privateSubnet1 = vpc.privateSubnets[0];
    // const privateSubnet2 = vpc.privateSubnets[1];

    /** PUBLIC SUBNET 1 CONFIGURATION */
    // Route Table for Public Subnet 1
    const publicSubnet1RouteTable = new ec2.CfnRouteTable(
      this,
      "PublicSubnet1RouteTable",
      {
        vpcId: vpc.vpcId,
      }
    );

    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "publicSubnet1RouteTableAssociation",
      {
        routeTableId: publicSubnet1RouteTable.attrRouteTableId,
        subnetId: publicSubnet1.subnetId,
      }
    );

    // Route for Public Subnet 1
    const PublicSubnet1Route = new ec2.CfnRoute(this, "PublicSubnet1Route", {
      routeTableId: publicSubnet1RouteTable.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: vpc.internetGatewayId,
    });

    // Elastic IPs for public subnets
    const publicSubnet1EIP = new ec2.CfnEIP(this, "PublicSubnet1EIP", {
      domain: "vpc",
    });

    // NAT Gateways for public subnets
    const publicSubnet1NATGateway = new ec2.CfnNatGateway(
      this,
      "PublicSubnet1NATGateway",
      {
        subnetId: publicSubnet1.subnetId,
        allocationId: publicSubnet1EIP.attrAllocationId,
      }
    );

    /** PUBLIC SUBNET 2 CONFIGURATION */
    // Route Table for Public Subnet 2
    const publicSubnet2RouteTable = new ec2.CfnRouteTable(
      this,
      "PublicSubnet2RouteTable",
      {
        vpcId: vpc.vpcId,
      }
    );

    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "publicSubnet2RouteTableAssociation",
      {
        routeTableId: publicSubnet2RouteTable.attrRouteTableId,
        subnetId: publicSubnet2.subnetId,
      }
    );

    // Route for Public Subnet 2
    const PublicSubnet2Route = new ec2.CfnRoute(this, "PublicSubnet2Route", {
      routeTableId: publicSubnet2RouteTable.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: vpc.internetGatewayId,
    });

    const publicSubnet2EIP = new ec2.CfnEIP(this, "PublicSubnet2EIP", {
      domain: "vpc",
    });

    const publicSubnet2NATGateway = new ec2.CfnNatGateway(
      this,
      "PublicSubnet2NATGateway",
      {
        subnetId: publicSubnet2.subnetId,
        allocationId: publicSubnet2EIP.attrAllocationId,
      }
    );

    /** Private SUBNET 1 CONFIGURATION */
    // Route Table for Private Subnet 1
    const privateSubnet1RouteTable = new ec2.CfnRouteTable(
      this,
      "PrivateSubnet1RouteTable",
      {
        vpcId: vpc.vpcId,
      }
    );

    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "privateSubnet1RouteTableAssociation",
      {
        routeTableId: privateSubnet1RouteTable.attrRouteTableId,
        subnetId: privateSubnet1.subnetId,
      }
    );

    // Route for Private Subnet 1
    new ec2.CfnRoute(this, "PrivateSubnet1Route", {
      routeTableId: privateSubnet1RouteTable.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: publicSubnet1NATGateway.attrNatGatewayId,
    });

    /** PRIVATE SUBNET 2 CONFIGURATION */
    // Route Table for Private Subnet 2
    const privateSubnet2RouteTable = new ec2.CfnRouteTable(
      this,
      "PrivateSubnet2RouteTable",
      {
        vpcId: vpc.vpcId,
      }
    );

    new ec2.CfnSubnetRouteTableAssociation(
      this,
      "privateSubnet2RouteTableAssociation",
      {
        routeTableId: privateSubnet2RouteTable.attrRouteTableId,
        subnetId: privateSubnet2.subnetId,
      }
    );

    // Route for Private Subnet 2
    new ec2.CfnRoute(this, "PrivateSubnet2Route", {
      routeTableId: privateSubnet2RouteTable.attrRouteTableId,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: publicSubnet2NATGateway.attrNatGatewayId,
    });

    // Step 9: Create Internet Gateway
    const internetGateway = new ec2.CfnInternetGateway(
      this,
      "MyInternetGateway",
      {
        tags: [],
      }
    );

    // Step 10: Attach Internet Gateway to VPC
    const vpcGatewayAttachment = new ec2.CfnVPCGatewayAttachment(
      this,
      "MyVpcGatewayAttachment",
      {
        vpcId: vpc.vpcId,
        internetGatewayId: internetGateway.attrInternetGatewayId,
      }
    );

    // Associate the Internet Gateway with the VPC
    internetGateway.node.addDependency(vpcGatewayAttachment);

    // Associate the public subnet routes with the VPC
    PublicSubnet1Route.node.addDependency(vpcGatewayAttachment);
    PublicSubnet2Route.node.addDependency(vpcGatewayAttachment);

    //** DYNAMODB CONFIGURATION */
    // Create DynamoDB table
    const dyTable = new dynamodb.Table(this, "MyDynamoDBTable", {
      partitionKey: { name: "itemId", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dynamoGatewayEndpoint = vpc.addGatewayEndpoint(
      "dynamoGatewayEndpoint",
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      }
    );

    /** Logs */
    const logGroup1 = new logs.LogGroup(this, "my-log-group", {
      logGroupName: "my-log-group",
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const logStream = new logs.LogStream(this, "my-log-stream", {
      logGroup: logGroup1,
      logStreamName: "my-log-stream",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    /** IAM Roles & Policies */
    // Create ECS Task Role
    const taskRole1 = new iam.Role(this, "my-ecs-task-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "my-ecs-task-role",
      description: "This is a Task Role for ECS",
    });

    // Create ECS Execution Role
    const executionRole1 = new iam.Role(this, "my-ecs-execution-role", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      roleName: "my-ecs-execution-role",
      description: "This is a Execution Role for ECS",
    });

    // Create a custom IAM policy statement
    const customExecutionRolePolicyStatement = {
      effect: iam.Effect.ALLOW,
      action: [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
      resource: [logGroup1.logGroupArn],
    };

    // Create a custom policy
    const newExecutionRolePolicy = new iam.Policy(
      this,
      "my-ecs-execution-role-policy",
      {
        policyName: "my-ecs-execution-role-policy",
        statements: [
          new iam.PolicyStatement(customExecutionRolePolicyStatement),
        ],
      }
    );

    // Attach a custom policy to an execution role
    executionRole1.attachInlinePolicy(newExecutionRolePolicy);

    // Alternatively, Add a managed policy to roles
    taskRole1.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );

    executionRole1.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        // ? Some managed policy names start with "service-role/", some start with "job-function/", and some don't start with anything. Do include the prefix when constructing this object.
        "service-role/AmazonECSTaskExecutionRolePolicy"
      )
    );

    //** ECS CLUSTER CONFIGURATION */
    // Create ECS cluster
    const cluster = new ecs.Cluster(this, "MyECSCluster", {
      vpc: vpc,
      containerInsights: true,
    });

    // ** SECURITY GROUP CONFIGURATION */
    // Create a Security group
    const securityGroup = new ec2.SecurityGroup(this, "my-security-group", {
      securityGroupName: "my-security-group",
      description: "security group",
      vpc,
      allowAllOutbound: true,
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
    // ** END OF A SECURITY GROUP CONFIGURATION */

    // Security Group for ECS Service
    const ecsSecurityGroup = new ec2.SecurityGroup(this, "MyEcsSg", {
      vpc: vpc,
      description: "Security Group for ECS",
      allowAllOutbound: true, // Allow all outbound traffic by default
    });
    ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.allTraffic(),
      "Allow all outbound traffic by default"
    );

    // Step 13: Create Security Group for Elastic Load Balancer(ELB)
    const lbSecurityGroup = new ec2.SecurityGroup(this, "MyAlbSg", {
      vpc,
      description: "Security Group for ELB",
    });
    lbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allow from anyone on port 80"
    );

    // Security Group Egress from Load Balancer to ECS Service
    const albToEcsSecurityGroupEgress = new ec2.CfnSecurityGroupEgress(
      this,
      "MyAlbToEcsSecurityGroupEgress",
      {
        groupId: lbSecurityGroup.securityGroupId,
        description: "Load balancer to target",
        destinationSecurityGroupId: ecsSecurityGroup.securityGroupId,
        ipProtocol: "tcp",
        fromPort: 80,
        toPort: 80,
      }
    );

    // Security Group Ingress from Load Balancer to ECS Service
    const albToEcsSecurityGroupIngress = new ec2.CfnSecurityGroupIngress(
      this,
      "MyAlbToEcsSecurityGroupIngress",
      {
        ipProtocol: "tcp",
        description: "Load balancer to target",
        fromPort: 80,
        groupId: ecsSecurityGroup.securityGroupId,
        sourceSecurityGroupId: lbSecurityGroup.securityGroupId,
        toPort: 80,
      }
    );

    // Step 12: Create Elastic Load Balancer
    const appLoadBalancer = new elbv2.ApplicationLoadBalancer(this, "MyAlb", {
      loadBalancerName: "My-Alb",
      vpc,
      deletionProtection: false,
      internetFacing: false, // internal
      securityGroup: lbSecurityGroup,
      vpcSubnets: {
        subnets: [...vpc.privateSubnets],
      },
    });

    // Target Group for ECS Service
    const ecsTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "MyEcsTargetGroup",
      {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        vpc: vpc,
      }
    );

    // Listener for Load Balancer
    const albListener = new elbv2.ApplicationListener(this, "MyAlbListener", {
      defaultAction: elbv2.ListenerAction.forward([ecsTargetGroup]),
      loadBalancer: appLoadBalancer,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    // Log Group
    const logGroup = new logs.LogGroup(this, "my-log-group", {
      retention: logs.RetentionDays.INFINITE,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Step 16: Create IAM Role for Task
    const taskRole = new iam.Role(this, "MyTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    // Step 17: Attach a policy to the IAM Role for Task
    taskRole.attachInlinePolicy(
      new iam.Policy(this, "MyTaskRolePolicy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
            effect: iam.Effect.ALLOW,
          }),
        ],
      })
    );

    // IAM Role for ECS Task Definition Execution
    const executionRole = new iam.Role(this, "MyExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    // IAM Policy for ECS Task Definition Execution Role
    const executionRolePolicy = new iam.Policy(this, "MyExecutionRolePolicy", {
      policyName: "my-fargate-execution-role",
      statements: [
        new iam.PolicyStatement({
          actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
          effect: iam.Effect.ALLOW,
          resources: [logGroup.logGroupArn],
        }),
      ],
      roles: [executionRole],
    });

    executionRole.attachInlinePolicy(executionRolePolicy);

    // Step 15: Create ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, "MyTaskDef", {
      cpu: 512,
      executionRole: executionRole,
      memoryLimitMiB: 2048,
      taskRole: taskRole,
    });

    taskDefinition.addContainer("task-def-container-id", {
      essential: true,
      image: ecs.ContainerImage.fromAsset(
        path.resolve(__dirname, "../api-service/")
      ),
      logging: new ecs.AwsLogDriver({
        streamPrefix: "my-docker-image/my-container/ecs-task-id",
        logGroup: logGroup,
      }),
      dockerLabels: {},
      containerName: "my-container",
      portMappings: [{ containerPort: 80, protocol: ecs.Protocol.TCP }],
      environment: {
        DYNAMO_TABLE_NAME: dyTable.tableName,
        AWS_REGION: process.env.CDK_DEFAULT_REGION!,
      },
    });

    // Create an ECS Fargate service
    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "MyFargateService",
        {
          cluster: cluster,
          desiredCount: 2,
          maxHealthyPercent: 200,
          minHealthyPercent: 50,
          healthCheckGracePeriod: cdk.Duration.seconds(60),
          enableECSManagedTags: false,
          loadBalancerName: "my-fargate-service",
          deploymentController: {
            type: ecs.DeploymentControllerType.ECS,
          },
          taskDefinition: taskDefinition,
          assignPublicIp: false,
          taskSubnets: {
            subnets: [...vpc.privateSubnets],
          },
          securityGroups: [ecsSecurityGroup],
        }
      );

    // Create Fargate service
    const fargateService1 =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        "my-fargate-service",
        {
          serviceName: "my-fargate-service",
          taskSubnets: {
            subnets: [...vpc.publicSubnets],
          },
          securityGroups: [securityGroup],
          cluster: cluster,
          taskImageOptions: {
            image: ecs.ContainerImage.fromAsset(
              path.resolve(__dirname, "../src/")
            ),
            environment: {
              MY_VAR: "variable01",
            },
            enableLogging: true,
            logDriver: new ecs.AwsLogDriver({
              streamPrefix: "my-fargate-service",
              logGroup: logGroup,
            }),
            executionRole,
            taskRole,
            containerName: "my-ecs-container",
            containerPort: 80,
            dockerLabels: {},
          },
          publicLoadBalancer: true,
          openListener: true,
          listenerPort: 80,
          desiredCount: 2,
          cpu: 512,
          memoryLimitMiB: 1024,
        }
      );

    // Create a Target group with type IP and register targets with PrivateSubnet1 and PrivateSubnet2
    // --> "Primary Private IPv4 address(you get it from Network interfaces)".
    // Create a Target Group
    const targetGroup1 = new elbv2.ApplicationTargetGroup(
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

    fargateService1.loadBalancer.addListener("my-alb-listener", {
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 80,
      defaultTargetGroups: [targetGroup1], // OR defaultAction: elbv2.ListenerAction.forward([targetGroup]),
      open: true,
    });

    fargateService.node.addDependency(ecsTargetGroup);
    fargateService.node.addDependency(albListener);

    // Allow DynamoDB actions from the Fargate Task Definition only
    dynamoGatewayEndpoint.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
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

    fargateService.targetGroup.configureHealthCheck({ path: "/health" });
    dyTable.grantReadWriteData(fargateService.taskDefinition.taskRole);

    // Output DynamoDB table name
    new cdk.CfnOutput(this, "DynamoDbTableName", { value: dyTable.tableName });

    // Load Balancer DNS and Service URL
    new cdk.CfnOutput(this, "MyLoadBalancerDNS", {
      value: appLoadBalancer.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, "MyServiceURL", {
      value: `http://${appLoadBalancer.loadBalancerDnsName}`,
    });
  }
}
