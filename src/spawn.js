import { spawn as childSpawn } from 'child_process'
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export default function spawn(baseMqttUrl, baseApiUrl, name, workDir, enableLogging = false){
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const scriptPath = join(__dirname, 'runner.js');
    var command = `node ${scriptPath} --mqtt ${baseMqttUrl} --api ${baseApiUrl} --name ${name} --dir ${workDir}`

    const child = childSpawn(command, [], { shell: true, cwd: process.cwd()})

    child.stdout.on('data', (data) => {
        if(enableLogging) console.log(`[spawn] stdout: ${data}`);
    });
    
    child.stderr.on('data', (data) => {
        if(enableLogging) console.error(`[spawn] stderr: ${data}`);
    });

    child.on('close', async (code) => {
        if(enableLogging) console.log(`[spawn] Process exited with code ${code}`);
    }); 
}