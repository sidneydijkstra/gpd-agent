import fs from 'fs'

export async function useFile(config, folderPath, logger){
    logger.log(`Running job useFile with config: `, config)

    var filename = config?.filename ?? ''

    // Check if filename is provided
    if (filename == '') {
        logger.log(`Filename not provided`)
        return false
    }

    var content = config?.content ?? ''
    var directory = config?.directory ?? ''
    
    // Check if directory is provided and prepare it
    if (directory != '') {
        directory = '/' + directory.replace(/^\.\//, '').replace(/^\//, '')
    }

    // Create directory if not exists
    if (!fs.existsSync(`${folderPath}${directory}`)){
        fs.mkdirSync(`${folderPath}${directory}`, {recursive: true})
    }

    // Create file with content
    fs.writeFileSync(`${folderPath}${directory}/${filename}`, content)

    logger.log(`File ${filename} created`)

    return true
}