import fs from 'fs';
import { useGenerateApi } from "./useGenerateApi.js";

export function getSetting(baseApiUrl, key){
    const client = useGenerateApi(baseApiUrl, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return client.setting.global[`${key}`].get();
}

export function getTransaction(baseApiUrl, pipelineGuid, transactionGuid){
    const client = useGenerateApi(baseApiUrl, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return client.pipeline[`${pipelineGuid}`].transaction[`${transactionGuid}`].get();
}

export function getTransactionTasks(baseApiUrl, pipelineGuid, transactionGuid){
    const client = useGenerateApi(baseApiUrl, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return client.pipeline[`${pipelineGuid}`].transaction[`${transactionGuid}`].task.get();
}

export function getWork(baseApiUrl, transactionGuid, filePath){
    const client = useGenerateApi(baseApiUrl, {
        headers: {},
    });

    return new Promise((resolve, reject) => {
        client.worker[`${transactionGuid}`].work.file()
            .then(response => {
                const fileStream = fs.createWriteStream(filePath);
                response.pipe(fileStream);
                response.on('error', (err) => {
                    reject(err);
                });

                fileStream.on('finish', () => {
                    resolve();
                });
            })
            .catch(err => {
                reject(err)
            })
    })
}

export function uploadArtifacts(baseApiUrl, transactionGuid, filePath){
    const client = useGenerateApi(baseApiUrl, {
        headers: {
            "Content-Type": "application/zip",
        },
    });

    return client.worker[`${transactionGuid}`].artifacts.pfile(filePath);
}

export function getStorage(baseApiUrl, transactionGuid, { name, guid }){
    const client = useGenerateApi(baseApiUrl, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    if(name){
        return client.worker[`${transactionGuid}`].storage.get({ name });
    }else if(guid){
        return client.worker[`${transactionGuid}`].storage.get({ guid });
    }else{
        return Promise.reject("No name or guid provided");
    }
}