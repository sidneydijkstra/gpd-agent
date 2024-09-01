import { describe, test } from 'node:test'
import assert from 'assert'
import fs from 'fs'

import { useCmd } from '../../src/jobs/useCmd.js'
import { dir } from 'console'

const cli = { log: (...args) => {} }
const workFolder = './'

describe('Testing job useCmd', () => {
    test('Test useCmd', async () => {
        const config = {
            command: 'echo test',
        }

        const result = await useCmd(config, workFolder, console)

        assert.strictEqual(result, true)
    })

    test('Test useCmd with directory', async () => {
        const config = {
            command: 'echo test',
            directory: '.test',
        }

        const result = await useCmd(config, workFolder, console)

        assert.strictEqual(result, true)

        // cleanup
        fs.rmSync(`${workFolder}${config.directory}`, { recursive: true })
    })

    test('Test useCmd with array as command', async () => {
        const config = {
            command: ['echo test', 'echo test2'],
            directory: '.test',
        }

        const result = await useCmd(config, workFolder, console)

        assert.strictEqual(result, true)

        // cleanup
        fs.rmSync(`${workFolder}${config.directory}`, { recursive: true })
    })

    test('Test useCmd invalid config failure', async () => {
        const config = {
            directory: '.test',
        }

        const result = await useCmd(config, workFolder, console)

        assert.strictEqual(result, false)
    })
})