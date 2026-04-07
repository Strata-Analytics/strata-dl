# strata-dl

AWS data lake infrastructure provisioned with Pulumi and TypeScript.

## Prerequisites

The following CLIs must be installed and available in your PATH:

- [`pulumi`](https://www.pulumi.com/docs/install/)
- `node` (v24)
- `aws` (with configured with SSO profiles)

## Configuration

Before deploying, edit `params.json` with your project values:

| Field | Description |
|---|---|
| `pulumiBackendBucketName` | S3 bucket name for Pulumi remote state |
| `gitProvider` | Source provider (e.g. `GitHub`) |
| `gitRepoId` | Repository identifier (e.g. `owner/repo`) |
| `projectName` | Used to name all AWS resources |
| `devopsSSORoleName` | The SSO role name in the devops account |
| `profiles.devops` | AWS CLI profile for the devops account |
| `profiles.transform.{env}` | AWS CLI profile for the {evn} data lake account |

## Deployment

Run the deployment script from the repository root:

```bash
./deploy.sh
```

The script will:

1. Verify that `pulumi`, `node`, and `aws` are installed and run `npm ci`
2. Validate all required fields in `params.json`
3. Set `AWS_PROFILE` to `profiles.devops` and log in to the Pulumi S3 backend
4. For each environment defined in `profiles.transform`, deploy in order:
   - `requirements` stack — IAM roles for cross-account access
   - `pipeline` stack — CodePipeline + CodeBuild for automated datalake deployments

After the script completes, you must **finish the CodeConnection setup manually** in the AWS Console (CodePipeline  → Settings → Connections) to authorize the GitHub integration.

## How datalake changes are deployed

Once the pipeline is set up, pushing commits that modify files under `datalake/` to the `{env}` branch will automatically trigger CodePipeline, which bundles the Lambda functions and runs `pulumi up` for the `datalake` stack in the corresponding environment.
