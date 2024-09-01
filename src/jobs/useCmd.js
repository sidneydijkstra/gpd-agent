import { spawn } from 'child_process';
import fs from 'fs';

export async function useCmd(config, folderPath, logger){
    logger.log(`Running job useCmd with config: `, config)

    var result = await Promise.resolve(new Promise((resolve, reject) => {
        var directory = config.hasOwnProperty('directory') ? config.directory : ''
        var command = config.hasOwnProperty('command') ? config.command : ''

        // Check if command is not empty
        if (command == '') {
            logger.log('useCmd: command is empty')
            resolve(false)
            return
        }
        
        // Check if directory is not empty
        if (directory != '') {
            directory = '/' + directory.replace(/^\.\//, '').replace(/^\//, '')
        }

        // Check if directory exists
        if (!fs.existsSync(`${folderPath}${directory}`)){
            logger.log(`useCmd: directory does not exist creating`)
            fs.mkdirSync(`${folderPath}${directory}`, { recursive: true })
        }

        // Check if command is an array
        if (Array.isArray(command)) {
            command = command.join(' && ')
        }

        const child = spawn(command, [], { shell: true, cwd: `${folderPath}${directory}` });

        child.stdout.on('data', (data) => {
            logger.log(data.toString());
        });

        child.stderr.on('data', (data) => {
            logger.log(data.toString());
        });

        child.on('close', (code) => {
            logger.log(`useCmd child process exited with code ${code}`);
            code == 0 ? resolve(true) : resolve(false)
        });
    }))

    return result
}