import fs from 'fs'
import YAML from 'yaml'

export function parseConfigFile(path){
    const file = fs.readFileSync(path, 'utf8')
    return YAML.parse(file)
}

export function parseConfigString(config){
    return YAML.parse(config)
}

export function processConfig(input, pattern, replaceFunction){
    // match can be for example '/${(.*?)}/g' meaning everything between ${}
    // we want to replace all the matches with the replaceFunction.
    // This functions needs the content inside the ${} to determine what to replace it with.
    // When replacing it needs to replace the whole match with the new content. Also the ${} should be removed.

    function replaceInObject(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    obj[key] = obj[key].replace(pattern, (match, p1) => {
                        // p1 is the content inside the ${}
                        const replacement = replaceFunction(p1);
                        return replacement;
                    })
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = replaceInObject(obj[key]);
                }
            }
        }

        return obj;
    }

    return replaceInObject(input)
}

// Example usage:
const inputString = "Hello, ${abc123.name}! Welcome to ${b.place}.";
const pattern = /\${(.*?)}/g;
const replaceFunction = (content) => {
    const replacements = {
        abc123: {
            name: "John",
            place: "Wonderland"
        },
        b: {
            name: "John",
            place: "Wonderland"
        }
    };

    try {
        var vars = content.split('.')
        return replacements[vars[0]][vars[1]] || content;
    } catch (e) {
        return content;
    }
};

// const result = processConfigString(inputString, pattern, replaceFunction);
// console.log(result); // Output: "Hello, John! Welcome to Wonderland."

// var parsedConfig = parseConfigString(`
// storage:
//   - name: 'MyStorage'
//   - guid: 'b4a0effe-ab60-4f3e-96a9-39df79b80957'
//     alias: 'GuidStorage'
//   - name: 'MyStorage'
//     alias: 'AliasStorage'

// jobs:
//   - name: 'Storage Test'
//     tasks:
//       - name: 'useCmd'
//         title: 'Print variable in MyStorage'
//         command: 'echo \${MyStorage.var}'
//       - name: 'useCmd'
//         title: 'Print variable in GuidStorage'
//         command: 'echo \${GuidStorage.var}'
//       - name: 'useCmd'
//         title: 'Print variable in AliasStorage'
//         command: 'echo \${AliasStorage.var}'
// `)
// console.log(parsedConfig)
// console.log(parsedConfig.jobs[0].tasks)