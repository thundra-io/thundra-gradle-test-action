import fetch from 'node-fetch'
import { parseString } from 'xml2js'

export async function getVersion(url: string, version?: string): Promise<string | undefined> {
    const response = await fetch(url)
    const json = await xml2json(await response.text())

    const availableVersions: string[] = json.metadata.versioning[0].versions[0].version
    const latestVersion: string = json.metadata.versioning[0].release[0]

    if (version && availableVersions.find(v => v === version)) {
        return version
    } else {
        return latestVersion
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function xml2json(xml: string): Promise<any> {
    return new Promise((resolve, reject) => {
        parseString(xml, function (err, json) {
            if (err) reject(err)
            else resolve(json)
        })
    })
}
