import * as aws from "@pulumi/aws"

export const devopsProvider = new aws.Provider("devops-provider", {
  assumeRoles: [
    {
      roleArn: ''
    },
  ],
});

export const transformProvider = new aws.Provider("datalake-provider", {
  assumeRoles: [
    {
      roleArn: ''
    },
  ],
});
