import process from "process";

const callbacks = []

export function onExit(callback){
    callbacks.push(callback)
}
  
// just in case some user like using "kill"
process.on("SIGTERM", async (signal) => {
    for (const callback of callbacks){
        await callback()
    }
    process.exit(0);
});

// catch ctrl-c, so that event 'exit' always works
process.on("SIGINT", async (signal) => {
    for (const callback of callbacks){
        await callback()
    }
    process.exit(0);
});

// what about errors
// try remove/comment this handler, 'exit' event still works
process.on("uncaughtException", async (err) => {
    for (const callback of callbacks){
        await callback()
    }
    process.exit(1);
});