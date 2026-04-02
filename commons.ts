import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"

export const projectName = 'strata-dl'
export const env = pulumi.getStack() as "dev" | "test" | "prod";

export function getName(name: string) {
  return `${projectName}-${env}-${name}`
}

export async function getAccountId(provider: aws.Provider) {
  return (await aws.getCallerIdentity({}, { provider })).accountId
}
