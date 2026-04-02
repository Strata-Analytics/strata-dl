# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**strata-dl** is a Pulumi/TypeScript project that provisions a serverless data lake on AWS. It uses **Bun** as the runtime and is organized into two independent Pulumi stacks.

## Commands

### Pulumi (run from within each stack directory)

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# Destroy infrastructure
pulumi destroy
```

### Build Lambda functions (run from repo root)

```bash
# Bundle all TypeScript Lambda functions via tsdown
bun run tsdown
```

Lambda bundles are output to `dist/` inside each lambda directory (e.g., `datalake/src/lambdas/test/dist/`).

### Install dependencies

```bash
bun install
```

## Architecture

Two independent Pulumi stacks with a deployment dependency:

### `requirements/` — Deploy first

Sets up cross-account IAM trust. Uses two AWS profiles configured via `pulumi config`:
- `devopsProfile` (e.g., `dl-devops`) — DevOps/orchestration account
- `transformProfile` (e.g., `dl-dev`) — Data lake/transform account

Creates IAM roles that allow the DevOps account to assume roles in the transform account for deployment.

### `datalake/` — Deploy second

Provisions the actual data lake resources using cross-account providers defined in `datalake/providers.ts`:
- **Three S3 buckets**: `raw`, `stage`, `analytics` — all with versioning and EventBridge notifications
- **Lambda functions** deployed via reusable components in `datalake/src/components/`
- **Lambda layers**: Powertools (Python), AWS SDK Pandas, custom Paramiko layer

### Shared utilities (`commons.ts`)

- `projectName` — `"strata-dl"`
- `env` — derived from the Pulumi stack name (e.g., `dev`, `prod`)
- `getName(suffix)` — generates consistent resource names: `strata-dl-{env}-{suffix}`
- `getAccountId(provider)` — retrieves AWS account ID for a given provider

### Lambda components

`TsLambda` (`datalake/src/components/tslambda.ts`) and `PyLambda` (`datalake/src/components/pylambda.ts`) are Pulumi ComponentResources that each create an IAM role + Lambda function. Pass `layers`, `memorySize`, and `timeout` as options.

### Adding a new Lambda

1. Create a directory under `datalake/src/lambdas/<name>/` with an `index.ts` (TypeScript) or `main.py` (Python)
2. `tsdown.config.ts` auto-discovers TypeScript lambdas — no config change needed for TS
3. Instantiate `TsLambda` or `PyLambda` in `datalake/src/` and import it from `datalake/index.ts`

## Stack Configuration

Config values are set per stack (e.g., `datalake/Pulumi.dev.yaml`):

| Key | Description |
|-----|-------------|
| `aws:region` | AWS region (default: `us-east-1`) |
| `devopsProfile` | AWS CLI profile for DevOps account |
| `transformProfile` | AWS CLI profile for transform account |

Role ARNs in `datalake/providers.ts` need to be populated after deploying the `requirements` stack.
