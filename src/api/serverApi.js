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