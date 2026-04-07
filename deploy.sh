#!/usr/bin/env bash
set -euo pipefail

# DEPENDENCIES
echo "==> 1/3 Checking for dependencies..."

for cmd in pulumi node aws; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is not installed."
    exit 1
  fi
done

npm ci

# VARIABLES
echo "==> 2/3 Checking variables..."

read -r gitProvider gitRepoId projectName devopsSSORoleName devopsRole pulumiBackendBucketName <<EOF
$(node --import=tsx -e "
import p from './params.json';
console.log(p.gitProvider, p.gitRepoId, p.projectName, p.devopsSSORoleName, p.profiles.devops, p.pulumiBackendBucketName);
")
EOF

for var in gitProvider gitRepoId projectName devopsSSORoleName devopsRole pulumiBackendBucketName; do
  if [[ -z "${!var}" ]]; then
    echo "Error: Variable '$var' is empty in params.json."
    exit 1
  fi
done

# DEPLOYING
echo "==> 3/3 Deploying..."

export AWS_PROFILE=$devopsRole

pulumi login s3://${pulumiBackendBucketName} || {
  echo "Failed to login to S3 backend"
  exit 1
}

export PULUMI_CONFIG_PASSPHRASE=''
ENVS=$(node --import=tsx -e "import params from './params.json'; console.log(Object.keys(params.profiles.transform).join(' '));")

for ENV in $ENVS; do
  TRANSFORM_PROF=$(node --import=tsx -e "import params from './params.json'; console.log(params.profiles.transform['$ENV']);")

  if [[ -n "$TRANSFORM_PROF" ]]; then
    echo "----Deploying requirements for $ENV----"
    pulumi --cwd requirements stack select "$ENV" --create
    pulumi --cwd requirements up --yes --non-interactive

    echo "----Deploying pipeline for $ENV----"
    pulumi --cwd pipeline stack select "$ENV" --create
    pulumi --cwd pipeline up --yes --non-interactive
  else
    echo "----Skipping Environment: $ENV (Missing transform profile)"
  fi
done

echo "==> Done."
echo "=== Finish setup of Code Connection in AWS dashboard ==="
