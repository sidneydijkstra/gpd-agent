import fs from 'fs'

export async function useArtifact(config, folderPath, logger){
    logger.log(`Running job useArtifact with config: `, config)

    if(config.hasOwnProperty('directory')){
        var directory = config?.directory ?? ''
        var targetDir = config?.targetDirectory ?? ''

        if (directory != '') {
            directory = '/' + directory.replace(/^\.\//, '').replace(/^\//, '')
        }

        if (targetDir != '') {
            targetDir = '/' + targetDir.replace(/^\.\//, '').replace(/^\//, '')

            if (!fs.existsSync(`${folderPath}/artifacts${targetDir}`)){
                fs.mkdirSync(`${folderPath}/artifacts${targetDir}`)
            }
        }else{
            targetDir = '/' + directory.split('/').pop()
            if (!fs.existsSync(`${folderPath}/artifacts${targetDir}`)){
                fs.mkdirSync(`${folderPath}/artifacts${targetDir}`)
            }
        }

        fs.cpSync(`${folderPath}${directory}`, `${folderPath}/artifacts${targetDir}`, {recursive: true})
    }else if (config.hasOwnProperty('file')){
        var file = config.file
        
        // Remove '.' from file if './' provided
        file = !file.startsWith('./') ? file : file.slice(1)
        // Add '/' to file string if not provided
        file = file.startsWith('/') ? file : `/${file}`
        
        if(config.hasOwnProperty('targetName')){
            var targetName = config.targetName

            fs.copyFileSync(`${folderPath}${file}`, `${folderPath}/artifacts/${targetName}`)
        }else {
            fs.copyFileSync(`${folderPath}${file}`, `${folderPath}/artifacts/${file.split('/').pop()}`)
        }
    }

    logger.log(`Artifact created`)

    return true
}