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
BUCKET_NAME=$(bun -e "import params from './params.json'; console.log(params.pulumiBackendBucketName);")
GITHUB_REPO_ID=$(bun -e "import params from './params.json'; console.log(params.githubRepoId);")
PROJECT_NAME=$(bun -e "import params from './params.json'; console.log(params.projectName);")
PROJECT_NAME=$(bun -e "import params from './params.json'; console.log(params.projectName);")
DEVOPS_DEV_PROFILE=$(bun -e "import params from './params.json'; console.log(params.profiles.dev.devops);")
TRANSFORM_DEV_PROFILE=$(bun -e "import params from './params.json'; console.log(params.profiles.dev.transform);")
DEVOPS_PROD_PROFILE=$(bun -e "import params from './params.json'; console.log(params.profiles.prod.devops);")
TRANSFORM_PROD_PROFILE=$(bun -e "import params from './params.json'; console.log(params.profiles.prod.transform);")

for var in BUCKET_NAME GITHUB_REPO_ID PROJECT_NAME; do
  if [[ -z "${!var}" ]]; then
    echo "Error: Variable '$var' is empty in params.json."
    exit 1
  fi
done

# DEPLOYING
pulumi login s3://${BUCKET_NAME} || {
  echo "Failed to login to S3 backend"
  exit 1
}

echo "==> 3/6 Deploying requirements for dev environment..."
pulumi --cwd requirements stack select dev --create
pulumi --cwd requirements up --yes --non-interactive

echo "==> 4/6 Deploying datalake pipeline for dev environment..."
pulumi --cwd pipeline stack select dev --create
pulumi --cwd pipeline up --yes --non-interactive

echo "==> 5/6 Deploying requirements for prod environment..."
pulumi --cwd requirements stack select prod --create
pulumi --cwd requirements up --yes --non-interactive

echo "==> 6/6 Deploying datalake pipeline for prod environment..."
pulumi --cwd pipeline stack select prod --create
pulumi --cwd pipeline up --yes --non-interactive

echo "==> Done."
