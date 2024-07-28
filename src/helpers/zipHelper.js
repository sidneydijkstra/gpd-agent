import fs from 'fs';
import archiver from 'archiver';
import decompress from 'decompress';

export function zipFolder(folderPath, zipPath) {
    return new Promise((resolve, reject) => {
        var output = fs.createWriteStream(zipPath);
        var archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', function() {
            resolve();
        });

        archive.on('error', function(err) {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(folderPath, false);
        archive.finalize();
    });
}

export function unzipFolder(zipPath, folderPath) {
    return decompress(zipPath, folderPath);
}