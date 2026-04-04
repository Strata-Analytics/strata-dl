import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"
import { tags } from "./commons"

const requirementsStackRef = new pulumi.StackReference(`organization/strata-dl-requirements/dev`)
export const devopsRoleArn = requirementsStackRef.getOutput('devopsRoleArn') as pulumi.Output<string>
export const transformRoleArn = requirementsStackRef.getOutput('transformRoleArn') as pulumi.Output<string>

export const devopsProvider = new aws.Provider("devops-provider", {
  defaultTags: {
    tags
  },
  assumeRoles: [
    {
      roleArn: devopsRoleArn
    },
  ],
});

export const transformProvider = new aws.Provider("datalake-provider", {
  defaultTags: {
    tags
  },
  assumeRoles: [
    {
      roleArn: transformRoleArn
    },
  ],
});
