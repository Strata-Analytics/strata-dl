import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws";

type TSLambdaArgs = {
  path: string
  description: string
  layers?: (pulumi.Output<string> | string)[]
  timeout?: number
  memory?: number
}

export class TSLambda extends pulumi.ComponentResource {
  function
  constructor(name: string, args: TSLambdaArgs, opts?: pulumi.ComponentResourceOptions) {
    super('stata-dl:index:ts-lambda', name, args, opts)

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
      runtime: aws.lambda.Runtime.NodeJS24dX,
      code: new pulumi.asset.FileArchive(args.path + '/dist'),
      handler: 'index.handler',
      description: args.description,
      layers: args.layers,
      memorySize: args.memory,
      timeout: args.timeout
    },
      {
        parent: this
      })
    this.registerOutputs({
      function: this.function
    });
  }
}
