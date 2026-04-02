import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import { getAccountId, getName } from "../commons";

const config = new pulumi.Config();
const devopsProfile = config.require('devopsProfile')
const transformProfile = config.require('transformProfile')

const devops = new aws.Provider("devops", {
  profile: devopsProfile
})
const transform = new aws.Provider("transformDev", {
  profile: transformProfile
})
const devopsAccountId = await getAccountId(devops)

new aws.iam.Role(getName('devops-deploy'), {
  assumeRolePolicy: {
    Version: aws.iam.PolicyDocumentVersion.PolicyDocumentVersion_2012_10_17,
    Statement: [
      {
        Effect: aws.iam.PolicyStatementEffect.ALLOW,
        Action: 'sts:AssumeRole',
        Principal: { AWS: `arn:aws:iam::${devopsAccountId}:root` },
        Condition: {
          "StringLike": {
            "aws:PrincipalArn": [
              `arn:aws:iam::${devopsAccountId}:role/aws-reserved/sso.amazonaws.com/AdministratorAccess*`
            ]
          }
        },
      }
    ]
  },
  managedPolicyArns: [aws.iam.ManagedPolicy.AdministratorAccess]
},
  {
    provider: devops
  }
)

new aws.iam.Role(getName('transform-deploy'), {
  assumeRolePolicy: {
    Version: aws.iam.PolicyDocumentVersion.PolicyDocumentVersion_2012_10_17,
    Statement: [
      {
        Effect: aws.iam.PolicyStatementEffect.ALLOW,
        Action: 'sts:AssumeRole',
        Principal: { AWS: `arn:aws:iam::${devopsAccountId}:root` },
        Condition: {
          "StringLike": {
            "aws:PrincipalArn": [
              `arn:aws:iam::${devopsAccountId}:role/aws-reserved/sso.amazonaws.com/AdministratorAccess*`
            ]
          }
        },
      }
    ]
  },
  managedPolicyArns: [aws.iam.ManagedPolicy.AdministratorAccess]
},
  {
    provider: transform
  }
)
