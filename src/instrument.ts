import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as ejs from 'ejs'
import { writeFileSync } from 'graceful-fs'
import { resolve, join } from 'path'
import { getVersion } from './version'

const THUNDRA_AGENT_REPOSITORY =
    'https://thundra-release-lab.s3-us-west-2.amazonaws.com/thundra-agent/thundra-agent-bootstrap.jar'

const GRADLE_TEST_PLUGIN =
    'https://repo1.maven.org/maven2/io/thundra/agent/thundra-gradle-test-plugin/maven-metadata.xml'

export async function instrument(plugin_version?: string): Promise<void> {
    const gradlePluginVersion: string | undefined = await getVersion(GRADLE_TEST_PLUGIN, plugin_version)
    if (!gradlePluginVersion) {
        core.warning("> Couldn't find an available version for Thundra Gradle Test Plugin")
        core.warning('> Instrumentation failed!')
        return
    }

    core.info('> Downloading the agent...')
    const agentPath = await tc.downloadTool(THUNDRA_AGENT_REPOSITORY)
    core.info(`> Successfully downloaded the agent to ${agentPath}`)

    core.info('> Generating init file...')
    const templatePath = join(__dirname, './templates/thundra.gradle.ejs')
    const initFilePath = join(__dirname, './thundra.gradle')
    const ejsData = {
        thundra: {
            gradlePluginVersion,
            agentPath
        }
    }
    ejs.renderFile(templatePath, ejsData, (error, result) => {
        if (error) {
            core.warning(`> EJS couldn't render the template file at ${templatePath} with ${JSON.stringify(ejsData)}`)
            core.warning(`> Caught the error: ${error}`)
            core.warning('> Instrumentation failed!')
            return
        }

        try {
            writeFileSync(initFilePath, result, 'utf-8')
        } catch (err) {
            core.warning(`> Couldn't write rendered EJS template to a file`)
            core.warning(`> Caught the error: ${err}`)
            core.warning('> Instrumentation failed!')
            return
        }
    })
    core.exportVariable('THUNDRA_GRADLE_INIT_SCRIPT_PATH', initFilePath)
    core.info(`> Successfully generated init file at ${initFilePath}`)

    resolve('Instrumentation is completed.')
}
