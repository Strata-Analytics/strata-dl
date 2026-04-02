import * as aws from "@pulumi/aws";
import { TSLambda } from "./components/tslambda";
import path from "node:path";
import { PYLambda } from "./components/pylambda";

new aws.s3.Bucket("raw", {
  forceDestroy: true
});

new aws.s3.Bucket("stage", {
  forceDestroy: true
});

new aws.s3.Bucket("analytics", {
  forceDestroy: true
});

new TSLambda('component-lambda', {
  path: path.join(__dirname, 'lambdas/test')
})


new PYLambda('pylambda', {
  path: path.join(__dirname, 'lambdas/pytest')
})
