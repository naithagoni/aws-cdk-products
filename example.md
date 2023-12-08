[Diagram]
                  S3 (Frontend app)
                       ⇧
Client -> Route53 -> CloudFront -> API Gateway -> **| VPC Link -> ALB -> ECS -> Fargate -> DynamoDB |**

[Diagram]
Client -> Route53 -> Regional/Global Load Balancer -> API Gateway -> ECS -> Fargate -> DynamoDB
