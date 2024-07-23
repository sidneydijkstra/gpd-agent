import { spawn } from 'child_process';

export async function useCmd(config, folderPath, logger){
    logger.log(`Running job useCmd with config: `, config)

    var result = await Promise.resolve(new Promise((resolve, reject) => {
        var directory = config.hasOwnProperty('directory') ? config.directory : ''
        var command = config.command
        
        if (directory != '') {
            directory = '/' + directory.replace(/^\.\//, '').replace(/^\//, '')
        }

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
            code == 0 ? resolve(true) : reject(false)
        });
    }))

    return result
}