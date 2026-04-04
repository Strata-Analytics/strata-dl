#!/usr/bin/env bash
set -euo pipefail

# DEPENDENCIES
echo "==> 1/6 Checking for dependencies..."
if ! command -v pulumi &>/dev/null; then
  echo "==> pulumi not found, installing..."
  curl -fsSL https://get.pulumi.com | sh
else
  echo "pulumi is installed. Continuing..."
fi

if ! command -v bun &>/dev/null; then
  echo "==> bun not found, installing..."
  curl -fsSL https://bun.sh/install | bash
else
  echo "bun is installed. Continuing..."
fi

# VARIABLES
echo "==> 2/6 Checking variables..."
if [ -z "$AWS_PROFILE" ]; then
  echo "Error: Variable 'AWS_PROFILE' pointing to the devops account profile must be set"
  exit 1
else
  echo "Continuing with '$AWS_PROFILE' profile"
fi

export PULUMI_CONFIG_PASSPHRASE=''
pulumiBackendBucketName=$(bun -e "import params from './params.json'; console.log(params.pulumiBackendBucketName);")
gitProvider=$(bun -e "import params from './params.json'; console.log(params.gitProvider);")
gitRepoId=$(bun -e "import params from './params.json'; console.log(params.gitRepoId);")
projectName=$(bun -e "import params from './params.json'; console.log(params.projectName);")
devopsSSORoleName=$(bun -e "import params from './params.json'; console.log(params.devopsSSORoleName);")

for var in pulumiBackendBucketName gitProvider gitRepoId projectName devopsSSORoleName; do
  if [[ -z "${!var}" ]]; then
    echo "Error: Variable '$var' is empty in params.json."
    exit 1
  fi
done

# DEPLOYING

echo "==> 3/6 Deploying..."
pulumi login s3://${pulumiBackendBucketName} || {
  echo "Failed to login to S3 backend"
  exit 1
}

ENVS=$(bun -e "import params from './params.json'; console.log(Object.keys(params.profiles).join(' '));")

for ENV in $ENVS; do
  DEVOPS_PROF=$(bun -e "import params from './params.json'; console.log(params.profiles['$ENV']?.devops || '');")
  TRANSFORM_PROF=$(bun -e "import params from './params.json'; console.log(params.profiles['$ENV']?.transform || '');")

  if [[ -n "$DEVOPS_PROF" && -n "$TRANSFORM_PROF" ]]; then
    echo "----Deploying requirements for $ENV----"
    pulumi --cwd requirements stack select "$ENV" --create
    pulumi --cwd requirements up --yes --non-interactive

    echo "----Deploying pipeline for $ENV----"
    pulumi --cwd pipeline stack select "$ENV" --create
    pulumi --cwd pipeline up --yes --non-interactive
  else
    echo "----Skipping Environment: $ENV (Missing devops or transform profiles)"
  fi
done

echo "==> Done."
echo "=== Finish setup of Code Connection in AWS dashboard ==="
