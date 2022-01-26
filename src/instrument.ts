import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as ejs from 'ejs'
import { writeFileSync } from 'graceful-fs'
import { resolve, join } from 'path'
import { getVersion } from './version'
import * as exec from '@actions/exec'

const THUNDRA_AGENT_METADATA =
    'https://repo.thundra.io/service/local/repositories/thundra-releases/content/io/thundra/agent/thundra-agent-bootstrap/maven-metadata.xml'

const GRADLE_TEST_PLUGIN =
    'https://repo1.maven.org/maven2/io/thundra/plugin/thundra-gradle-test-plugin/maven-metadata.xml'

export async function instrument(plugin_version?: string, agent_version?: string): Promise<void> {
    let agentPath: string

    const gradlePluginVersion: string | undefined = await getVersion(GRADLE_TEST_PLUGIN, plugin_version)
    if (!gradlePluginVersion) {
        core.warning("> Couldn't find an available version for Thundra Gradle Test Plugin")
        core.warning('> Instrumentation failed!')
        return
    }

    const thundraAgentVersion: string | undefined = await getVersion(THUNDRA_AGENT_METADATA, agent_version)
    if (!thundraAgentVersion) {
        core.warning("> Couldn't find an available version for Thundra Agent")
        core.warning('> Instrumentation failed!')
        return
    }

    if (process.env.LOCAL_AGENT_PATH) {
        agentPath = process.env.LOCAL_AGENT_PATH
        core.info(`> Using the local agent at ${agentPath}`)
    } else {
        core.info('> Downloading the agent...')
        agentPath = await tc.downloadTool(
            `https://repo.thundra.io/service/local/repositories/thundra-releases/content/io/thundra/agent/thundra-agent-bootstrap/${thundraAgentVersion}/thundra-agent-bootstrap-${thundraAgentVersion}.jar`
        )
        core.info(`> Successfully downloaded the agent to ${agentPath}`)
    }

    core.info('> Generating init file...')
    const templatePath = join(__dirname, 'templates/thundra.gradle.ejs')
    const initFilePath = join(__dirname, 'thundra.gradle')
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
            if (process.env.GRADLE_HOME) {
                const gradleHome: string = process.env.GRADLE_HOME.toString()
                const initDFolder = `${gradleHome}/init.d/`
                const gradleHomePath = join(initDFolder, 'thundra.gradle')
                writeFileSync(gradleHomePath, result, 'utf-8')
                core.info(`> Successfully generated init file at ${gradleHomePath}`)

            }

            core.exportVariable('THUNDRA_GRADLE_INIT_SCRIPT_PATH', initFilePath)
            core.info(`> Successfully generated init file at ${initFilePath}`)
        } catch (err) {
            core.warning(`> Couldn't write rendered EJS template to a file`)
            core.warning(`> Caught the error: ${err}`)
            core.warning('> Instrumentation failed!')
            return
        }
    })

    resolve('Instrumentation is completed.')
}
