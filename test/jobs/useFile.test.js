import { describe, test } from 'node:test'
import assert from 'assert'
import fs from 'fs'

import { useFile } from '../../src/jobs/useFile.js'

const cli = { log: (...args) => {} }
const workFolder = './.work'

describe('Testing job useFile', () => {
    test('Test useFile', async () => {
        const config = {
            filename: 'testnd.txt',
            content: 'testnd',
        }

        const result = await useFile(config, workFolder, cli)

        assert.strictEqual(result, true)

        // cleanup, remove .work folder
        fs.rmSync(workFolder, { recursive: true })
    })

    test('Test useFile with \\n', async () => {
        const config = {
            filename: 'testn.txt',
            content: 'test\\ntest',
            directory: 'testn',
        }

        const result = await useFile(config, workFolder, cli)

        assert.strictEqual(result, true)

        // cleanup, remove .work folder
        fs.rmSync(workFolder, { recursive: true })
    })

    test('Test useFile with directory', async () => {
        const config = {
            filename: 'testwd.txt',
            content: 'testwd',
            directory: 'testwd',
        }

        const result = await useFile(config, workFolder, cli)

        assert.strictEqual(result, true)

        // cleanup, remove .work folder
        fs.rmSync(workFolder, { recursive: true })
    })

    test('Test useFile with multiple directories (format 1/4)', async () => {
        const config = {
            filename: 'test1.txt',
            content: 'test1',
            directory: 'test1/test1/test1',
        }

        const result = await useFile(config, workFolder, cli)

        assert.strictEqual(result, true)

        assert(result)

        // cleanup, remove .work folder
        fs.rmSync(workFolder, { recursive: true })
    })

    test('Test useFile with multiple directories (format 2/4)', async () => {
        const config = {
            filename: 'test2.txt',
            content: 'test2',
            directory: '/test2/test2/test2',
        }

        const result = await useFile(config, workFolder, cli)

        assert.strictEqual(result, true)

        // cleanup, remove .work folder
        fs.rmSync(workFolder, { recursive: true })
    })

    test('Test useFile with multiple directories (format 3/4)', async () => {
        const config = {
            filename: 'test3.txt',
            content: 'test3',
            directory: './test3/test3/test3',
        }

        const result = await useFile(config, workFolder, cli)

        assert.strictEqual(result, true)

        // cleanup, remove .work folder
        fs.rmSync(workFolder, { recursive: true })
    })

    test('Test useFile with multiple directories (format 4/4)', async () => {
        const config = {
            filename: 'test4.txt',
            content: 'test4',
            directory: './test4/test4/test4/',
        }

        const result = await useFile(config, workFolder, cli)

        assert.strictEqual(result, true)

        // cleanup, remove .work folder
        fs.rmSync(workFolder, { recursive: true })
    })

    test('Test useFile invalid config failure', async () => {
        const config = {
            content: 'test',
        }

        const result = await useFile(config, workFolder, cli)

        assert.strictEqual(result, false)
    })
})