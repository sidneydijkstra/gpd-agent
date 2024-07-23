import fs from 'fs'
import YAML from 'yaml'

export function parseConfigFile(path){
    const file = fs.readFileSync(path, 'utf8')
    return YAML.parse(file)
}

export function parseConfigString(config){
    return YAML.parse(config)
}


// var parsedConfig = parseConfigString(`
// jobs:
//   - name: 'job1'
//     tasks:
//       - name: 'useCmd'
//         title: 'Run npm command'
//         command: 'npm --version'
//       - name: 'useCmd'
//         title: 'Run dir'
//         command:
//             - 'dir'
//             - 'ls'
// `)
// console.log(parsedConfig.jobs[0].tasks)