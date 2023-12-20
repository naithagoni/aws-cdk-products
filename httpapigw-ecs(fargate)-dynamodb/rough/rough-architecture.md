[Diagram]
                  S3 (Frontend app)
                       ⇧
Client -> Route53 -> CloudFront -> API Gateway -> **| ALB -> ECS -> Fargate -> DynamoDB |**

[Diagram]
Client -> Route53 -> Regional/Global Load Balancer -> API Gateway -> ECS -> Fargate -> DynamoDB

Prerequisites:
- Create a VPC with minimum 2 public and 2 private subnets and a bastion host.

Implementation:
1. Create a DynamoDb instance
2. Create ECS Fargate cluster.
3. Create AWS ECR Repository.
4. Upload the docker images to AWS ECR.
5. Create Application load-balancer.
6. Deploy images in ECS Fargate as containers.
7. Setup inter-service communication with ALB.
8. Expose API endpoints via API gateway for private endpoints.
9. Setup Cloud watch alarms for monitoring.

1. Basic configuration:
     -    name: MyALB
     -    Scheme: Internal
     -    IP address type: ipv4
3. Security groups: Assign default security group.
