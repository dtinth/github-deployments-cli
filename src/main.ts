import { cli } from 'tkt'
import { readFileSync } from 'fs'
import { Octokit } from '@octokit/rest'

const token = process.env['GITHUB_TOKEN']

const octokit = new Octokit({
  auth: token,
  previews: ['ant-man-preview', 'flash-preview'],
})

if (!token) {
  console.error('Missing environment variable GITHUB_TOKEN')
  process.exit(1)
}

cli()
  .command(
    'create-deployment',
    'Create a deployment',
    {
      owner: {
        description: 'Owner parameter',
        demand: true,
        type: 'string',
      },
      repo: {
        description: 'Repo parameter',
        demand: true,
        type: 'string',
      },
      ref: {
        description: 'The ref to deploy. This can be a branch, tag, or SHA',
        demand: true,
        type: 'string',
      },
      environment: {
        description: 'Name for the target deployment environment',
        type: 'string',
      },
      description: {
        description: 'Short description of the deployment',
        type: 'string',
      },
      requiredContexts: {
        description:
          'Comma-separated status contexts to verify against commit status checks. If you omit this parameter, GitHub verifies all unique contexts before creating a deployment. To bypass checking entirely, pass an empty string.',
        type: 'string',
      },
      transientEnvironment: {
        description:
          'Specifies if the given environment is specific to the deployment and will no longer exist at some point in the future',
        type: 'boolean',
      },
      productionEnvironment: {
        description:
          'Specifies if the given environment is one that end-users directly interact with',
        type: 'boolean',
      },
    },
    async args => {
      try {
        const out = await octokit.repos.createDeployment({
          owner: args.owner,
          repo: args.repo,
          ref: args.ref,
          environment: args.environment,
          transient_environment: args.transientEnvironment,
          production_environment: args.productionEnvironment,
          required_contexts:
            args.requiredContexts == null
              ? undefined
              : args.requiredContexts.split(',').filter(x => x),
        })
        console.log(JSON.stringify(out.data, null, 2))
      } catch (error) {
        throw new Error('Cannot create deployment: ' + error)
      }
    },
  )
  .command(
    'create-deployment-status',
    'Create a deployment status',
    {
      owner: {
        description: 'Owner parameter',
        demand: true,
        type: 'string',
      },
      repo: {
        description: 'Repo parameter',
        demand: true,
        type: 'string',
      },
      deploymentId: {
        description: 'Deployment ID parameter',
        type: 'number',
      },
      deployment: {
        description: 'Path to JSON deployment file',
        type: 'string',
      },
      state: {
        description:
          'The state of the status. Can be one of error, failure, inactive, in_progress, queued, pending, or success',
        demand: true,
        type: 'string',
      },
      logUrl: {
        description: "The full URL of the deployment's output",
        type: 'string',
      },
      description: {
        description:
          'A short description of the status. The maximum description length is 140 characters',
        type: 'string',
      },
      environmentUrl: {
        description: 'Sets the URL for accessing your environment',
        type: 'string',
      },
      autoInactive: {
        description:
          "Adds a new inactive status to all prior non-transient environment deployments with the same repository and environment name as the created status's deployment",
        type: 'boolean',
      },
    },
    async args => {
      if (!args.deploymentId && !args.deployment) {
        throw new Error('Must specify --deploymentId or --deployment')
      }
      try {
        const deploymentId =
          args.deploymentId ||
          JSON.parse(readFileSync(args.deployment!, 'utf8')).id
        const out = await octokit.repos.createDeploymentStatus({
          owner: args.owner,
          repo: args.repo,
          deployment_id: deploymentId,
          state: args.state as any,
          log_url: args.logUrl,
          description: args.description,
          environmentUrl: args.environmentUrl,
          auto_inactive: args.autoInactive,
        })
        console.log(JSON.stringify(out.data, null, 2))
      } catch (error) {
        throw new Error('Cannot create deployment: ' + error)
      }
    },
  )
  .parse()
