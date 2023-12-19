# How to identify public and private subnet in AWS?

  - Public Route table:
    1. VPC(eg: 10.0.0.0/16) -> local
    2. 0.0.0.0/0 -> igw-xxxx  <-- REFERE THIS
  - Private Route table:
    1. VPC(eg: 10.0.0.0/16) -> local
    2. 0.0.0.0/0 -> nat-xxxxx <-- REFERE THIS

![alt text](./images/img_subnet.png "Subnet")