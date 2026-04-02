import * as aws from "@pulumi/aws";
import * as pulumi from '@pulumi/pulumi'
import path from "node:path";

export const layerPythonPowertools = await aws.lambda.getLayerVersion({
  layerVersionArn: 'arn:aws:lambda:us-east-1:017000801446:layer:AWSLambdaPowertoolsPythonV3-python313-x86_64:19'
});

export const layerPythonPandas = await aws.lambda.getLayerVersion({
  layerVersionArn: 'arn:aws:lambda:us-east-1:336392948345:layer:AWSSDKPandas-Python314:2'
});

export const layerPythonParamiko = new aws.lambda.LayerVersion('paramiko-layer', {
  layerName: 'paramiko',
  description: 'paramiko layer',
  compatibleArchitectures: ['x86_64'],
  compatibleRuntimes: [aws.lambda.Runtime.Python3d14],
  code: new pulumi.asset.FileArchive(path.join(__dirname, './layers/paramiko')),
})
