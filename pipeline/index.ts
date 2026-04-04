import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { env, getName, gitRepoId, pulumiBackendBucketName, gitProvider } from "../commons";
import { devopsProvider, devopsRoleArn, transformRoleArn } from "../providers";

const artifactBucket = new aws.s3.Bucket(getName("pipeline-artifacts"), {
  forceDestroy: env === "dev",
}, { provider: devopsProvider });

const gitConnection = new aws.codeconnections.Connection(getName(gitProvider), {
  providerType: gitProvider,
}, { provider: devopsProvider });

const codebuildRole = new aws.iam.Role(getName("codebuild"), {
  assumeRolePolicy: {
    Version: aws.iam.PolicyDocumentVersion.PolicyDocumentVersion_2012_10_17,
    Statement: [
      {
        Effect: aws.iam.PolicyStatementEffect.ALLOW,
        Principal: aws.iam.Principals.CodeBuildPrincipal,
        Action: "sts:AssumeRole",
      },
    ],
  },
  inlinePolicies: [
    {
      name: 'logs',
      policy: (await aws.iam.getPolicyDocument({
        statements: [{
          actions: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          resources: ["*"]
        }]
      })).json
    },
    {
      name: 's3',
      policy: artifactBucket.arn.apply(async arn => (await aws.iam.getPolicyDocument({
        statements: [
          {
            actions: [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject",
              "s3:ListBucket"
            ],
            resources: [
              arn + '/*',
              `arn:aws:s3:::${pulumiBackendBucketName}/*`,
              `arn:aws:s3:::${pulumiBackendBucketName}`
            ]
          }
        ]
      }))).json
    },
    {
      name: 'sts',
      policy: pulumi.all([devopsRoleArn, transformRoleArn]).apply(async ([arn1, arn2]) => (await aws.iam.getPolicyDocument({
        statements: [
          {
            actions: [
              "sts:AssumeRole"
            ],
            resources: [arn1, arn2]
          }
        ]
      }))).json
    }

  ],
}, { provider: devopsProvider });

const deployProject = new aws.codebuild.Project(getName("deploy-project"), {
  serviceRole: codebuildRole.arn,
  artifacts: { type: "CODEPIPELINE" },
  environment: {
    computeType: "BUILD_GENERAL1_SMALL",
    image: "aws/codebuild/standard:7.0",
    type: "LINUX_CONTAINER",
    environmentVariables: [
      {
        name: "PULUMI_BACKEND_URL",
        value: `s3://${pulumiBackendBucketName}`,
      },
    ],
  },
  source: {
    type: "CODEPIPELINE",
    buildspec: JSON.stringify({
      version: "0.2",
      phases: {
        install: {
          'runtime-versions': {
            nodejs: 24,
          },
          commands: [
            'curl -fsSL https://bun.sh/install | bash',
            'export PATH=$HOME/.bun/bin:$PATH',
            'curl -fsSL https://get.pulumi.com | sh',
            'export PATH=$PATH:/root/.pulumi/bin',
            'npm ci'
          ],
        },
        pre_build: {
          commands: [
            'export PULUMI_CONFIG_PASSPHRASE=""',
            'echo "Pulumi backend URL:" $PULUMI_BACKEND_URL',
            'pulumi login "$PULUMI_BACKEND_URL"',
          ]
        },
        build: {
          commands: [
            "npx tsdown",
            "cd datalake",
            `pulumi stack select ${env} --create`,
            'pulumi up --yes --non-interactive',
          ],
        },
      },
    }),
  },
}, { provider: devopsProvider });

const pipelineRole = new aws.iam.Role(getName("pipeline"), {
  assumeRolePolicy: {
    Version: aws.iam.PolicyDocumentVersion.PolicyDocumentVersion_2012_10_17,
    Statement: [
      {
        Effect: aws.iam.PolicyStatementEffect.ALLOW,
        Principal: aws.iam.Principals.CodePipelinePrincipal,
        Action: "sts:AssumeRole",
      },
    ],
  },
  inlinePolicies: [
    {
      name: 's3',
      policy: artifactBucket.arn.apply(async arn => (
        await aws.iam.getPolicyDocument({
          statements: [{
            actions: [
              "s3:GetBucketVersioning",
              "s3:GetBucketAcl",
              "s3:GetBucketLocation",
              "s3:PutObject",
              "s3:PutObjectAcl",
              "s3:GetObject",
              "s3:GetObjectVersion"
            ],
            resources: [
              arn,
              arn + '/*'
            ]
          }]
        })).json)
    },
    {
      name: 'codebuild',
      policy: deployProject.arn.apply(async arn => (
        await aws.iam.getPolicyDocument({
          statements: [{
            actions: [
              "codebuild:BatchGetBuilds",
              "codebuild:StartBuild",
              "codebuild:BatchGetBuildBatches",
              "codebuild:StartBuildBatch"
            ],
            resources: [arn]
          }]
        })).json)
    },
    {
      name: 'codeconnections',
      policy: gitConnection.arn.apply(async arn => (
        await aws.iam.getPolicyDocument({
          statements: [{
            actions: [
              "codeconnections:UseConnection",
              "codestar-connections:UseConnection"
            ],
            resources: [
              arn
            ]
          }]
        })).json)
    }
  ]
}, { provider: devopsProvider });

new aws.codepipeline.Pipeline(getName("datalake"), {
  roleArn: pipelineRole.arn,
  artifactStores: [
    {
      location: artifactBucket.bucket,
      type: "S3",
    },
  ],
  triggers: [
    {
      providerType: "CodeStarSourceConnection",
      gitConfiguration: {
        sourceActionName: gitProvider,
        pushes: [
          {
            branches: {
              includes: [
                env
              ]
            },
            filePaths: {
              includes: [
                'datalake/**'
              ]
            }
          }
        ],
      }

    }
  ],
  pipelineType: 'V2',
  stages: [
    {
      name: "Source",
      actions: [
        {
          name: gitProvider,
          category: "Source",
          owner: "AWS",
          provider: "CodeStarSourceConnection",
          version: "1",
          outputArtifacts: ["source"],
          configuration: {
            ConnectionArn: gitConnection.arn,
            FullRepositoryId: gitRepoId,
            BranchName: env,
            DetectChanges: "true",
          },
        },
      ],
    },
    {
      name: "Deploy",
      actions: [
        {
          name: "Pulumi",
          category: "Build",
          owner: "AWS",
          provider: "CodeBuild",
          version: "1",
          inputArtifacts: ["source"],
          configuration: { ProjectName: deployProject.name },
        },
      ],
    },
  ],
}, { provider: devopsProvider });
