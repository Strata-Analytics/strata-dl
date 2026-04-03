import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"

const requirementsRef = new pulumi.StackReference(`organization/strata-dl-requirements/dev`)
const devopsRoleArn = requirementsRef.getOutput('devopsRoleArn')
const transformRoleArn = requirementsRef.getOutput('transformRoleArn')



export const devopsProvider = new aws.Provider("devops-provider", {
  assumeRoles: [
    {
      roleArn: devopsRoleArn
    },
  ],
});

export const transformProvider = new aws.Provider("datalake-provider", {
  assumeRoles: [
    {
      roleArn: transformRoleArn
    },
  ],
});
