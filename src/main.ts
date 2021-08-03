import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as semver from 'semver'

import { instrument } from './instrument'

const apikey: string = core.getInput('apikey')
const project_id: string = core.getInput('project_id')
const command: string = core.getInput('command')
const plugin_version: string = core.getInput('plugin_version')
const agent_version: string = core.getInput('agent_version')

if (!apikey) {
    core.warning('Thundra API Key is not present. Exiting early...')
    core.warning('Instrumentation failed.')

    process.exit(core.ExitCode.Success)
}

if (!project_id) {
    core.warning('Thundra Project ID is not present. Exiting early...')
    core.warning('Instrumentation failed.')

    process.exit(core.ExitCode.Success)
}

// Setting environment variables programmatically
core.exportVariable('THUNDRA_APIKEY', apikey)
core.exportVariable('THUNDRA_AGENT_TEST_PROJECT_ID', project_id)

if (agent_version && semver.lt(agent_version, '2.7.0')) {
    core.setFailed(`Thundra Java Agent prior to 2.7.0 doesn't work with this action`)
}

async function run(): Promise<void> {
    try {
        core.info(`[Thundra] Initializing the Thundra Action...`)

        core.startGroup('[Thundra] Instrumentation')
        core.info(`> Instrumenting the application`)
        await instrument(plugin_version, agent_version)
        core.endGroup()

        if (command) {
            core.info(`[Thundra] Executing the command`)

            if (process.env.THUNDRA_GRADLE_INIT_SCRIPT_PATH) {
                await exec.exec(`sh -c "${command} --init-script ${process.env.THUNDRA_GRADLE_INIT_SCRIPT_PATH}"`)
            } else {
                core.info('> Init script generation failed')
                core.info('> Instrumentation skipped')

                await exec.exec(`sh -c "${command}"`)
            }
        }
    } catch (error) {
        core.setFailed(error.message)
    }
}

run()
