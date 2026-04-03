import * as aws from "@pulumi/aws";
import { env, getName, githubRepoId, pulumiBackendBucketName } from "../commons";
import { devopsProvider, transformRoleArn } from "../providers";

const githubBranch = env === 'prod' ? "main" : 'dev';

const artifactBucket = new aws.s3.Bucket(getName("pipeline-artifacts"), {
  forceDestroy: env === "dev",
}, { provider: devopsProvider });

const githubConnection = new aws.codestarconnections.Connection(getName("github"), {
  providerType: "GitHub",
}, { provider: devopsProvider });

const codebuildRole = new aws.iam.Role(getName("codebuild"), {
  assumeRolePolicy: {
    Version: "2012-10-17",
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
      name: 'assume-deploy-role',
      policy: transformRoleArn.apply(async arn => (
        await aws.iam.getPolicyDocument({
          statements: [{
            actions: ["sts:AssumeRole"],
            resources: [arn]
          }]
        })).json)
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
          commands: [
            'curl -fsSL https://bun.sh/install | bash',
            'export PATH=$HOME/.bun/bin:$PATH',
            'curl -fsSL https://get.pulumi.com | sh',
            'export PATH=$PATH:/root/.pulumi/bin',
            'npm ci'
          ],
        },
        prebuild: {
          commands: [
            'export PULUMI_CONFIG_PASSPHRASE=""',
            'echo "Pulumi backend URL:" $PULUMI_BACKEND_URL',
            'pulumi login "$PULUMI_BACKEND_URL"',
          ]
        },
        build: {
          commands: [
            "npx tsdown",
            `cd datalake && pulumi up --stack ${env} --yes --non-interactive`,
          ],
        },
      },
    }),
  },
}, { provider: devopsProvider });

const pipelineRole = new aws.iam.Role(getName("pipeline"), {
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { Service: "codepipeline.amazonaws.com" },
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
            actions: ["s3:GetObject", "s3:PutObject", "s3:GetBucketVersioning", "s3:GetObjectVersion"],
            resources: [arn, arn + '/*']
          }]
        })).json)
    },
    {
      name: 'codebuild',
      policy: deployProject.arn.apply(async arn => (
        await aws.iam.getPolicyDocument({
          statements: [{
            actions: ["codebuild:BatchGetBuilds", "codebuild:StartBuild"],
            resources: [arn]
          }]
        })).json)
    },
    {
      name: 'codestar',
      policy: githubConnection.arn.apply(async arn => (
        await aws.iam.getPolicyDocument({
          statements: [{
            actions: ["codestar-connections:UseConnection"],
            resources: [arn]
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
  pipelineType: 'V2',
  stages: [
    {
      name: "Source",
      actions: [
        {
          name: "GitHub",
          category: "Source",
          owner: "AWS",
          provider: "CodeStarSourceConnection",
          version: "1",
          outputArtifacts: ["source"],
          configuration: {
            ConnectionArn: githubConnection.arn,
            FullRepositoryId: githubRepoId,
            BranchName: githubBranch,
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
