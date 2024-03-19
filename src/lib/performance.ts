
import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;

const timers: {
    [key: string]: {
        startTime: bigint,
        paused?: bigint
    }
} = {}

export const start = (label: string) => {
    if (!label) throw new Error("A label must be provided to start the timer.")
    if (timers[label]) throw new Error("A timer with that label already exists.")
    timers[label] = {
        startTime: process.hrtime.bigint()
    }
}
export const getTime = (label: string) => {
    if (!label) throw new Error("A label must be provided to get the timer.")
    if (!timers[label]) throw new Error("A timer with that label doesn't exist.")
    const time = timers[label].paused
                ? timers[label].paused - timers[label].startTime
                : process.hrtime.bigint() - timers[label].startTime
    const result = (Number(time) / 1000000).toFixed(5)
    if (parseFloat(result) >= 1000) return `${(Number(time) / 1000000000).toFixed(2)}s`
    return `${(Number(time) / 1000000).toFixed(3)}ms`
}
export const getRawTime = (label: string) => {
    if (!label) throw new Error("A label must be provided to get the timer.")
    if (!timers[label]) throw new Error("A timer with that label doesn't exist.")

    // startTime - pausedTime if paused
    if (timers[label].paused) return timers[label].paused - timers[label].startTime
    return process.hrtime.bigint() - timers[label].startTime
}
export const log = (label: string, time: bigint = getRawTime(label)) => {
    if (!label) throw new Error("A label must be provided to log the timer.")
    if (!timers[label]) throw new Error("A timer with that label doesn't exist.")
    global.logger.log(`${label}: ${formatRawTime(time)}`, "PERFORMANCE")

}
export const formatRawTime = (time: bigint) => {
    const result = (Number(time) / 1000000).toFixed(5)
    if (parseFloat(result) >= 1000) return `${(Number(time) / 1000000000).toFixed(2)}s`
    return `${(Number(time) / 1000000).toFixed(3)}ms`
}
export const pause = (label: string) => {
    if (!label) throw new Error("A label must be provided to pause the timer.")
    if (!timers[label]) throw new Error("A timer with that label doesn't exist.")
    if (timers[label].paused) throw new Error("The timer is already paused.")
    timers[label].paused = process.hrtime.bigint()   
}
export const resume = (label: string) => {
    if (!label) throw new Error("A label must be provided to resume the timer.")
    if (!timers[label]) throw new Error("A timer with that label doesn't exist.")
    if (!timers[label].paused) throw new Error("The timer must be paused to resume it.")
    timers[label].startTime += process.hrtime.bigint() - timers[label].paused
    delete timers[label].paused
}

export const end = (label: string, options:{silent:boolean}={silent:false}) => {
    if (!label) throw new Error("A label must be provided to end the timer.")
    if (!timers[label]) throw new Error("A timer with that label doesn't exist.")
    const final = getRawTime(label)
    if (!options.silent)
    log(label, final)
    delete timers[label]
    return formatRawTime(final)
}

export default {
    start,
    getTime,
    getRawTime,
    log,
    formatRawTime,
    end,
    pause,
    resume
}