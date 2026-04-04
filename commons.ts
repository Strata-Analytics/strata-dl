import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import params from './params.json'

const isCodeBuild = !!process.env.CODEBUILD_BUILD_ID;
if (!isCodeBuild && !process.env.AWS_PROFILE) {
  throw new Error('ERROR :::::: AWS_PROFILE env variable must be set to your profile for devops account ::::::')
}

export const githubRepoId = params.githubRepoId

export const pulumiBackendBucketName = params.pulumiBackendBucketName

export const projectName = params.projectName

export const env = pulumi.getStack() as "dev" | "prod";

export function getName(name: string) {
  return `${projectName}-${env}-${name}`
}

export async function getAccountId(provider: aws.Provider) {
  return (await aws.getCallerIdentity({}, { provider })).accountId
}
