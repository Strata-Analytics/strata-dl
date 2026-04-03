import * as aws from "@pulumi/aws";
import { env, getName } from "../../commons";
import { transformProvider } from "../../providers";

// RAW BUCKET
const rawBucket = new aws.s3.Bucket(getName('raw'), {
  forceDestroy: env === 'dev',
}, { provider: transformProvider });
new aws.s3.BucketNotification(getName('raw-notifications'), {
  bucket: rawBucket.bucket,
  eventbridge: true
}, { provider: transformProvider })
new aws.s3.BucketVersioning(getName('raw-versioning'), {
  bucket: rawBucket.bucket,
  versioningConfiguration: {
    status: 'Enabled'
  }
}, { provider: transformProvider })

// STAGE BUCKET
const stageBucket = new aws.s3.Bucket(getName('stage'), {
  forceDestroy: env === 'dev'
}, { provider: transformProvider });
new aws.s3.BucketNotification(getName('stage-notifications'), {
  bucket: stageBucket.bucket,
  eventbridge: true
}, { provider: transformProvider })
new aws.s3.BucketVersioning(getName('stage-versioning'), {
  bucket: stageBucket.bucket,
  versioningConfiguration: {
    status: 'Enabled'
  }
}, { provider: transformProvider })

// ANALYTICS BUCKET
const analyticsBucket = new aws.s3.Bucket(getName('analytics'), {
  forceDestroy: env === 'dev'
}, { provider: transformProvider });
new aws.s3.BucketNotification(getName('analytics-notifications'), {
  bucket: analyticsBucket.bucket,
  eventbridge: true
}, { provider: transformProvider })
new aws.s3.BucketVersioning(getName('analytics-versioning'), {
  bucket: analyticsBucket.bucket,
  versioningConfiguration: {
    status: 'Enabled'
  }
}, { provider: transformProvider })
