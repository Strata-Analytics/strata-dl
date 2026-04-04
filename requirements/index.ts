import * as aws from "@pulumi/aws"
import { env, getAccountId, getName, projectName } from "../commons";
import params from '../params.json'


const devops = new aws.Provider("devops", {
  profile: params.profiles[env].devops
})
const transform = new aws.Provider("transformDev", {
  profile: params.profiles[env].transform
})
const devopsAccountId = await getAccountId(devops)

const devopsRole = new aws.iam.Role(getName('devops-deploy'), {
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
              `arn:aws:iam::${devopsAccountId}:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess*`,
              `arn:aws:iam::${devopsAccountId}:role/${projectName}-${env}-codebuild-*`
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

const transformRole = new aws.iam.Role(getName('transform-deploy'), {
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
              `arn:aws:iam::${devopsAccountId}:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess*`,
              `arn:aws:iam::${devopsAccountId}:role/${projectName}-${env}-codebuild-*`
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

export const devopsRoleArn = devopsRole.arn
export const transformRoleArn = transformRole.arn
