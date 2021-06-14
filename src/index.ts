import { getInput, info, setFailed, setOutput } from '@actions/core'
import { getOctokit } from '@actions/github'
import { context } from '@actions/github/lib/utils'

const getCommitRef = () => {
  if (context.eventName === 'push') {
    return {
      base: context.payload.before,
      head: context.payload.after,
    }
  }
  if (context.eventName === 'pull_request' && context.payload.pull_request) {
    return {
      base: context.payload.pull_request.base.sha,
      head: context.payload.pull_request.head.sha,
    }
  }
  setFailed(
    `Failed to retrieve the base and head commits for this ${context.eventName}`,
  )
}

const main = async () => {
  try {
    const token = getInput('token', { required: true })
    const octokit = getOctokit(token)
    const commitRef = getCommitRef()
    info(`Env: ${JSON.stringify(process.env, null, 2)} `)
    info(`Context: ${JSON.stringify(context, null, 2)}`)
    info(`Base commit: ${commitRef?.base}`)
    info(`Head commit: ${commitRef?.head}`)
    const response = await octokit.rest.repos.compareCommits({
      owner: context.repo.owner,
      repo: context.repo.repo,
      base: commitRef?.base,
      head: commitRef?.head,
    })
    info(`Eventname ${context.eventName}`)
    if (response.status !== 200)
      setFailed(
        `Comparing the base and head commits for this ${context.eventName} event returned ${response.status}, expected 200.`,
      )
    if (response.data.status === 'behind')
      setFailed(
        `The head commit for this ${context.eventName} event is not ahead of the base commit`,
      )
    const packages = new Set<string>()
    const files = response.data.files || []
    for (const file of files) {
      const filename = file.filename
      const result = filename.match(/^packages\/([\w-]+)/)
      if (result) {
        packages.add(result[1])
      }
    }
    info(`List packages: ${Array.from(packages).join(',')}`)
    setOutput('packages', `${Array.from(packages).join(',')}`)
  } catch (error) {
    setFailed(error)
  }
}

main()
