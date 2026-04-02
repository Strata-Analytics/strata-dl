import * as pulumi from "@pulumi/pulumi"
import * as aws from "@pulumi/aws"

export const projectName = 'strata-dl'
export const env = pulumi.getStack() as "dev" | "prod";

const config = new pulumi.Config();
const exchangeRole = config.require("exchangeRole");
const transformRole = config.require("transformRole");

const exchangeProvider = new aws.Provider("landing-provider", {
  assumeRoles: [
    {
      roleArn: exchangeRole
    },
  ],
});

const transformProvider = new aws.Provider("datalake-provider", {
  assumeRoles: [
    {
      roleArn: transformRole
    },
  ],
});
