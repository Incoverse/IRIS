
import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;

import {readFileSync,writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { resolve } from "path";
import * as threads from "worker_threads"

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");


interface IRISWorker extends threads.Worker {
    run?: (...imports: any) => void
}

export function generateWorker(code: Function, imports:string="", workerData?: object) {
    writeFileSync(`${__dirname}/worker.js`, `
    import { parentPort, workerData } from "worker_threads"
    ${imports}
    parentPort.once("message", (imports) => {
        ${code.toString().replace(code.name, "run_function")}
        if (run_function.constructor.name != "AsyncFunction") parentPort.postMessage(run_function(workerData, ...imports))
        else run_function(workerData, ...imports).then(result => parentPort.postMessage(result))
    });
`)
    let worker: IRISWorker = new threads.Worker(`${__dirname}/worker.js`, {workerData, env: process.env, argv: process.argv})
    worker.once("error", (error) => {
        global.logger.debugError(`Error in worker: ${error}`, returnFileName())
        // console.error(error)
    })
    worker.run = (...imports) => {
        worker.postMessage(imports)
    }
    return worker
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];