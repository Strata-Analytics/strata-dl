import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import params from './params.json'

const isCodeBuild = !!process.env.CODEBUILD_BUILD_ID;
if (!isCodeBuild && !process.env.AWS_PROFILE) {
  throw new Error('ERROR :::::: AWS_PROFILE env variable must be set to your profile for devops account ::::::')
}

export const githubRepoId = params.githubRepoId
if (!githubRepoId) {
  throw new Error('ERROR :::::: Add "githubRepoId" in params.json ::::::')
}

export const pulumiBackendBucketName = params.pulumiBackendBucketName
if (!pulumiBackendBucketName) {
  throw new Error('ERROR :::::: Add "pulumiBackendBucketName" in params.json ::::::')
}

export const projectName = params.projectName

if (!projectName) {
  throw new Error('ERROR :::::: Add "projectName" in params.json ::::::')
}

export const env = pulumi.getStack() as "dev" | "prod";

export function getName(name: string) {
  return `${projectName}-${env}-${name}`
}

export async function getAccountId(provider: aws.Provider) {
  return (await aws.getCallerIdentity({}, { provider })).accountId
}
