import * as aws from "@pulumi/aws"

export const exchangeProvider = new aws.Provider("landing-provider", {
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
