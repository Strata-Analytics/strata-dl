import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws";

type PYLambdaArgs = {
  path: string
}

export class PYLambda extends pulumi.ComponentResource {
  function
  constructor(name: string, args: PYLambdaArgs, opts?: pulumi.ComponentResourceOptions) {
    super('stata-dl:index:py-lambda', name, args, opts)

    const role = new aws.iam.Role(`${name}-role`, {
      assumeRolePolicy: {
        Version: aws.iam.PolicyDocumentVersion.PolicyDocumentVersion_2012_10_17,
        Statement: [
          {
            Principal: aws.iam.Principals.LambdaPrincipal,
            Effect: aws.iam.PolicyStatementEffect.ALLOW,
            Action: 'sts:AssumeRole'
          }
        ]
      },
      managedPolicyArns: [
        aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
      ]
    },
      {
        parent: this
      })

    this.function = new aws.lambda.Function(`${name}-function`, {
      role: role.arn,
      runtime: aws.lambda.Runtime.Python3d14,
      code: new pulumi.asset.FileArchive(args.path),
      handler: 'main.handler'
    },
      {
        parent: this
      })
    this.registerOutputs({
      function: this.function
    });
  }
}
