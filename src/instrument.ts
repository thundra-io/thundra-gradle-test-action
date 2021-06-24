import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import { resolve } from 'path'
import { getVersion } from './version'

const THUNDRA_AGENT_REPOSITORY =
    'https://thundra-release-lab.s3-us-west-2.amazonaws.com/thundra-agent/thundra-agent-bootstrap.jar'

const MAVEN_INSTRUMENTATION_METADATA =
    'https://repo1.maven.org/maven2/io/thundra/agent/thundra-agent-gradle-test-instrumentation/maven-metadata.xml'

export async function instrument(instrumenter_version?: string): Promise<void> {
    const mavenInstrumenterVersion: string | undefined = await getVersion(
        MAVEN_INSTRUMENTATION_METADATA,
        instrumenter_version
    )
    if (!mavenInstrumenterVersion) {
        core.warning("> Couldn't find an available version for Thundra Maven Instrumentation script")
        core.warning('> Instrumentation failed!')
        return
    }

    core.info('> Downloading the agent...')
    const agentPath = await tc.downloadTool(THUNDRA_AGENT_REPOSITORY)
    core.info(`> Successfully downloaded the agent to ${agentPath}`)

    core.info('> Downloading the maven instrumentater')
    const mvnInstrumentaterPath = await tc.downloadTool(
        `https://repo1.maven.org/maven2/io/thundra/agent/thundra-agent-maven-test-instrumentation/${mavenInstrumenterVersion}/thundra-agent-maven-test-instrumentation-${mavenInstrumenterVersion}.jar`
    )
    core.info(`> Successfully downloaded the maven instrumentater to ${mvnInstrumentaterPath}`)

    core.info('> Updating pom.xml...')

    const poms = await exec.getExecOutput(`sh -c "find ${process.cwd()} -name \\"pom.xml\\" -exec echo '{}' +"`)
    if (poms.stdout && poms.stdout.trim()) {
        await exec.exec(`sh -c "java -jar ${mvnInstrumentaterPath} ${agentPath} \\"${poms.stdout.trim()}\\""`)
        core.info('> Update to pom.xml is done')
    } else {
        core.warning("> Couldn't find any pom.xml files. Exiting the instrumentation step.")
    }

    resolve('Instrumentation is completed.')
}
