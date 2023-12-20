# How to identify public and private subnet in AWS?

  - Public Route table:
    1. VPC(eg: 10.0.0.0/16) -> local
    2. 0.0.0.0/0 -> igw-xxxx  <-- REFERE THIS
  - Private Route table:
    1. VPC(eg: 10.0.0.0/16) -> local
    2. 0.0.0.0/0 -> nat-xxxxx <-- REFERE THIS

![alt text](./images/img_subnet.png "Subnet")

IAM Statement Changes
┌───┬────────────────────────────────┬────────┬────────────────────────────────┬─────────────────────────────────┬───────────┐
│   │ Resource                       │ Effect │ Action                         │ Principal                       │ Condition │
├───┼────────────────────────────────┼────────┼────────────────────────────────┼─────────────────────────────────┼───────────┤
│ + │ ${my-fargate-service/TaskDef/E │ Allow  │ sts:AssumeRole                 │ Service:ecs-tasks.amazonaws.com │           │
│   │ xecutionRole.Arn}              │        │                                │                                 │           │
├───┼────────────────────────────────┼────────┼────────────────────────────────┼─────────────────────────────────┼───────────┤
│ + │ ${my-fargate-service/TaskDef/T │ Allow  │ sts:AssumeRole                 │ Service:ecs-tasks.amazonaws.com │           │
│   │ askRole.Arn}                   │        │                                │                                 │           │
├───┼────────────────────────────────┼────────┼────────────────────────────────┼─────────────────────────────────┼───────────┤
│ + │ ${my-fargate-service/TaskDef/m │ Allow  │ logs:CreateLogStream           │ AWS:${my-fargate-service/TaskDe │           │
│   │ y-container/LogGroup.Arn}      │        │ logs:PutLogEvents              │ f/ExecutionRole}                │           │
├───┼────────────────────────────────┼────────┼────────────────────────────────┼─────────────────────────────────┼───────────┤
│ + │ *                              │ Allow  │ ecr:GetAuthorizationToken      │ AWS:${my-fargate-service/TaskDe │           │
│   │                                │        │                                │ f/ExecutionRole}                │           │
├───┼────────────────────────────────┼────────┼────────────────────────────────┼─────────────────────────────────┼───────────┤
│ + │ arn:aws:ec2:us-east-1:05602600 │ Allow  │ ec2:AuthorizeSecurityGroupEgre │ AWS:${Custom::VpcRestrictDefaul │           │
│   │ 6387:security-group/${my-vpc.D │        │ ss                             │ tSGCustomResourceProvider/Role} │           │
│   │ efaultSecurityGroup}           │        │ ec2:AuthorizeSecurityGroupIngr │                                 │           │
│   │                                │        │ ess                            │                                 │           │
│   │                                │        │ ec2:RevokeSecurityGroupEgress  │                                 │           │
│   │                                │        │ ec2:RevokeSecurityGroupIngress │                                 │           │
├───┼────────────────────────────────┼────────┼────────────────────────────────┼─────────────────────────────────┼───────────┤
│ + │ arn:aws:ecr:us-east-1:05602600 │ Allow  │ ecr:BatchCheckLayerAvailabilit │ AWS:${my-fargate-service/TaskDe │           │
│   │ 6387:repository/cdk-hnb659fds- │        │ y                              │ f/ExecutionRole}                │           │
│   │ container-assets-056026006387- │        │ ecr:BatchGetImage              │                                 │           │
│   │ us-east-1                      │        │ ecr:GetDownloadUrlForLayer     │                                 │           │
└───┴────────────────────────────────┴────────┴────────────────────────────────┴─────────────────────────────────┴───────────┘
IAM Policy Changes
┌───┬───────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────┐
│   │ Resource                                                  │ Managed Policy ARN                                         │
├───┼───────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────┤
│ + │ ${Custom::VpcRestrictDefaultSGCustomResourceProvider/Role │ {"Fn::Sub":"arn:${AWS::Partition}:iam::aws:policy/service- │
│   │ }                                                         │ role/AWSLambdaBasicExecutionRole"}                         │
└───┴───────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────┘
Security Group Changes
┌───┬──────────────────────────────────────────────────┬─────┬────────────┬──────────────────────────────────────────────────┐
│   │ Group                                            │ Dir │ Protocol   │ Peer                                             │
├───┼──────────────────────────────────────────────────┼─────┼────────────┼──────────────────────────────────────────────────┤
│ + │ ${my-fargate-service/LB/SecurityGroup.GroupId}   │ In  │ TCP 80     │ Everyone (IPv4)                                  │
│ + │ ${my-fargate-service/LB/SecurityGroup.GroupId}   │ Out │ TCP 80     │ ${my-fargate-service/Service/SecurityGroup.Group │
│   │                                                  │     │            │ Id}                                              │
├───┼──────────────────────────────────────────────────┼─────┼────────────┼──────────────────────────────────────────────────┤
│ + │ ${my-fargate-service/Service/SecurityGroup.Group │ In  │ TCP 80     │ ${my-fargate-service/LB/SecurityGroup.GroupId}   │
│   │ Id}                                              │     │            │                                                  │
│ + │ ${my-fargate-service/Service/SecurityGroup.Group │ Out │ Everything │ Everyone (IPv4)                                  │
│   │ Id}                                              │     │            │                                                  │
└───┴──────────────────────────────────────────────────┴─────┴────────────┴──────────────────────────────────────────────────┘