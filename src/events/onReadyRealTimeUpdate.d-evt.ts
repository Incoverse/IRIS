/*
  * Copyright (c) 2024 Inimi | InimicalPart | Incoverse
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  *
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { IRISGlobal } from "@src/interfaces/global.js";
import { IRISCommand } from "@src/lib/base/IRISCommand.js";
import { IRISEvent, IRISEventTypeSettings, IRISEventTypes } from "@src/lib/base/IRISEvent.js";
import { addCommand, reloadCommands, setupHandler, unloadHandler } from "@src/lib/utilities/misc.js";
import chalk from "chalk";
import { Client, Events } from "discord.js";
import fs from "fs";
import crypto from "crypto";
import Watcher from "watcher";
import path from "path";
import treeKill from "tree-kill";

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

import { removeCommand } from "@src/lib/utilities/misc.js";
import { spawn, ChildProcessWithoutNullStreams } from "child_process"
import prettyMilliseconds from "pretty-ms";
declare const global: IRISGlobal

const updateCooldown = new Map<string, number>()

let aFCProcess: ChildProcessWithoutNullStreams = null
let commandWatcher: Watcher
let eventWatcher: Watcher


const automaticFileCompilationCmd = "npx tsc-watch --onSuccess \"node makeRunnable.js\""
export default class OnReadyRealTimeUpdate extends IRISEvent {
    protected _type: IRISEventTypes = "onStart"
    protected _typeSettings: IRISEventTypeSettings;
    protected _eventSettings: IRISEvCoSettings = {
        devOnly: true,
        mainOnly: false
    }
    protected _canBeReloaded: boolean = true

    public async unload(client: Client, reason?: string) {
        if (reason != "internal-kill") global.communicationChannel.off("ORRTU:shutdown", this.unload.bind(this, client, "internal-kill"), this.fileName)
        await this.killAFC()
        await this.closeCommandWatcher()
        await this.closeEventWatcher()
        this._loaded = false
        return true
    }

    private async killAFC() {
        return new Promise((resolve) => {
            if (aFCProcess && !aFCProcess.killed) {
                aFCProcess.on("exit", () => {
                    resolve(true)
                })
                treeKill(aFCProcess.pid)
            } else {
                resolve(true)
            }
        })
    }

    private async closeCommandWatcher() {
        return new Promise((resolve) => {
            if (commandWatcher && !commandWatcher.isClosed()) {
                commandWatcher.on("close", () => {
                    resolve(true)
                })
                commandWatcher.close()
            } else {
                resolve(true)
            }
        })
    }

    private async closeEventWatcher() {
        return new Promise((resolve) => {
            if (eventWatcher && !eventWatcher.isClosed()) {
                eventWatcher.on("close", () => {
                    resolve(true)
                })
                eventWatcher.close()
            } else {
                resolve(true)
            }
        })
    }


    public async setup(client: Client) {

        global.communicationChannel.once("ORRTU:shutdown", this.unload.bind(this, client, "internal-kill"), this.fileName)
        this._loaded = true
        return true
    }

    public async runEvent(client: Client) {
        let ready = false
        if (fs.existsSync(process.cwd() + "/src") && global.app.config.autoCompile) {
            global.logger.log("Loading automatic file compilation...", this.fileName)

            aFCProcess = spawn(automaticFileCompilationCmd.split(" ")[0], automaticFileCompilationCmd.split(" ").slice(1), {
                shell: true,
                detached: false,
            }) 

            let tempReady = false
            aFCProcess.stdout.on("data", (data) => {
                if (data.toString().includes("Done!")) {
                    if (!tempReady) {
                        tempReady = true
                        setTimeout(()=>ready = true, 1500)
                        global.logger.log("Automatic file compilation is "+chalk.greenBright("ready")+".", this.fileName)
                    } else {
                        global.logger.log("Successfully compiled the changes made to the source code.", this.fileName)
                    }
                } 
            })
 
            aFCProcess.stderr.on("data", (data) => {
                console.log(data.toString())
                global.logger.error("Errors were detected in the changes made to the source code. Compilation failed.", this.fileName)
            })

            aFCProcess.on("exit", (code) => {
                global.logger.log(`Automatic file compilation has ${chalk.redBright("stopped")}.`, this.fileName)
            })

        } else {
            global.logger.warn(`Automatic file compilation is ${chalk.redBright("disabled")}`, this.fileName)
        }

        commandWatcher = new Watcher(process.cwd() + "/dist/commands", {
            renameDetection: true,
            ignoreInitial: true,
            renameTimeout: 1250,
            debounce: 500
        })

        eventWatcher = new Watcher(process.cwd() + "/dist/events", {
            renameDetection: true,
            ignoreInitial: true,
            renameTimeout: 1250,
            debounce: 500
        })

        commandWatcher.on("close", () => {
            global.logger.log(`Command watcher has been ${chalk.redBright("closed")}.`, this.fileName)
        })

        eventWatcher.on("close", () => {
            global.logger.log(`Event watcher has been ${chalk.redBright("closed")}.`, this.fileName)
        })

        commandWatcher.on("ready", () => {
            global.logger.log(`Command watcher is ${chalk.greenBright("ready")}.`, this.fileName)

            commandWatcher.on("rename", async (oldPath, newPath)=>{
                if (!newPath.endsWith(".cmd.js") && !oldPath.endsWith(".cmd.js") || !ready) return;

                if (oldPath.endsWith(".cmd.js") && !newPath.endsWith(".cmd.js")) {
                    commandWatcher.emit("unlink", oldPath)
                    return
                }

                if (!oldPath.endsWith(".cmd.js") && newPath.endsWith(".cmd.js")) {
                    commandWatcher.emit("add", newPath)
                    return
                }
                const responsibleHandler = global.requiredModules[
                    Object.keys(global.requiredModules).filter(key => key.startsWith("cmd")).find(key => global.requiredModules[key].fileName == path.basename(oldPath))
                ]
                if (!responsibleHandler) return


                const antiCacheValue = new Date().getTime().toString()
                const newHandlerClass = (await import(newPath + "?_="+antiCacheValue)).default
                const oldPathClassName = responsibleHandler.constructor.name
                const newHandlerClassName = newHandlerClass.name
                
                
                if (oldPathClassName == newHandlerClassName) {
                    global.logger.debug(`The file containing command ${chalk.yellowBright(oldPathClassName)} (${chalk.yellowBright(path.basename(oldPath))}) was renamed to ${chalk.yellowBright(path.basename(newPath))}. Reloading...`, this.fileName)

                    //! Unload the old handler
                    const removedHandler = responsibleHandler as IRISCommand
                    const unloadResult = await unloadHandler(removedHandler.commandSettings.unloadTimeoutMS??IRISCommand.defaultUnloadTimeoutMS, removedHandler, client, "reload")
                    delete global.requiredModules[`cmd${removedHandler.constructor.name}`]
                    if (unloadResult == "timeout") {
                        global.logger.error(`Command ${chalk.redBright(removedHandler.constructor.name)} failed to unload within the ${chalk.yellowBright(removedHandler.commandSettings.unloadTimeoutMS??IRISCommand.defaultUnloadTimeoutMS)} ms timeout.`, this.fileName)
                        return
                    }
                    const newHandler = new newHandlerClass(client) as IRISCommand
                    newHandler.cache = removedHandler.cache
                    await newHandler.validateCache()
                    await newHandler.setupSubCommands(client)
                    const setupResult = await setupHandler(newHandler.commandSettings.setupTimeoutMS??IRISCommand.defaultSetupTimeoutMS, newHandler, client, "reload")
                    if (setupResult == "timeout") {
                        global.logger.error(`Command ${chalk.redBright(newHandler.constructor.name)} failed to setup within the ${chalk.yellowBright(newHandler.commandSettings.setupTimeoutMS??IRISCommand.defaultSetupTimeoutMS)} ms timeout.`, this.fileName)
                        return
                    }
                    global.requiredModules[`cmd${newHandler.constructor.name}`] = newHandler

                    if (removedHandler?.slashCommand?.toJSON() != newHandler?.slashCommand?.toJSON()) {
                        const newCommands = Object.keys(global.requiredModules).filter(a=>a.startsWith("cmd")).map(key => global.requiredModules[key].slashCommand.toJSON())
                        global.reload.commands = newCommands
                        await reloadCommands(client, newCommands)
                    }
                    global.logger.log(`Command ${chalk.greenBright(newHandler.constructor.name)} has been reloaded.`, this.fileName)

                }                       
            })
                
            commandWatcher.on("unlink", async (filePath)=>{
                if (!filePath.endsWith(".cmd.js") || !ready) return;
                const responsibleHandler = global.requiredModules[
                    Object.keys(global.requiredModules).filter(key => key.startsWith("cmd")).find(key => global.requiredModules[key].fileName == path.basename(filePath))
                ]
                if (!responsibleHandler) return
                global.logger.debug(`The file containing command ${chalk.yellowBright(responsibleHandler.constructor.name)} was deleted. Removing command...`, this.fileName)

                const handler = responsibleHandler as IRISCommand
                const unloadResult = await unloadHandler(handler.commandSettings.unloadTimeoutMS??IRISCommand.defaultUnloadTimeoutMS, handler, client, null)
                delete global.requiredModules[`cmd${handler.constructor.name}`]
                if (unloadResult == "timeout") {
                    global.logger.error(`Command ${chalk.redBright(handler.constructor.name)} failed to unload within the ${chalk.yellowBright(handler.commandSettings.unloadTimeoutMS??IRISCommand.defaultUnloadTimeoutMS)} ms timeout.`, this.fileName)
                    return
                }
                await removeCommand(client, handler.slashCommand.name)
                global.logger.log(`Command ${chalk.redBright(handler.constructor.name)} has been removed.`, this.fileName)
            })

            commandWatcher.on("add", async (filePath)=>{
                if (!filePath.endsWith(".cmd.js") || !ready) return; // TODO: Add support for command libraries (.cmdlib.js)
                try {
                    const antiCacheValue = new Date().getTime().toString()
                    const newHandlerClass = (await import(filePath + "?_="+antiCacheValue))?.default
                    global.logger.debug(`A new file containing command ${chalk.yellowBright(newHandlerClass.name??"Unknown")} (${chalk.yellowBright(path.basename(filePath))}) was detected. Loading...`, this.fileName)
                    
                    
                    if (Object.keys(global.requiredModules).includes(`cmd${newHandlerClass.name}`)) {
                        const conflictedFile = global.requiredModules[`cmd${newHandlerClass.name}`].fileName
                        global.logger.error(`Command ${chalk.redBright(path.basename(filePath))} failed to load due to a name conflict with ${chalk.redBright(conflictedFile)}.`, this.fileName)
                        return
                    }
                    
                    const newHandler = new newHandlerClass(client) as IRISCommand
                    const setupResult = await setupHandler(newHandler.commandSettings.setupTimeoutMS??IRISCommand.defaultSetupTimeoutMS, newHandler, client, "duringRun")
                    if (setupResult == "timeout") {
                        global.logger.error(`Command ${chalk.redBright(newHandler.constructor.name)} failed to setup within the ${chalk.yellowBright(newHandler.commandSettings.setupTimeoutMS??IRISCommand.defaultSetupTimeoutMS)} ms timeout.`, this.fileName)
                        return
                    }
                    global.requiredModules[`cmd${newHandler.constructor.name}`] = newHandler
                    await addCommand(client, newHandler.slashCommand.toJSON())
                    global.logger.log(`Command ${chalk.greenBright(newHandler.constructor.name)} has been loaded.`, this.fileName)
                } catch (e) {
                    global.logger.error(`Command ${chalk.redBright(path.basename(filePath))} failed to load due to invalid syntax: ${e.toString()}`, this.fileName)
                }
            })

            commandWatcher.on("change", async (filePath)=>{
                if (!filePath.endsWith(".cmd.js") || !ready) return;

                const antiCacheValue = new Date().getTime().toString()
                const responsibleHandler = global.requiredModules[
                    Object.keys(global.requiredModules).filter(key => key.startsWith("cmd")).find(key => global.requiredModules[key].fileName == path.basename(filePath))
                ]
                if (!responsibleHandler) return
                global.logger.debug(`A change was detected in the file containing command ${chalk.yellowBright(responsibleHandler.constructor.name)} (${chalk.yellowBright(path.basename(filePath))}). Reloading...`, this.fileName)


                if (updateCooldown.has(filePath) && new Date().getTime() - updateCooldown.get(filePath) < 250) {
                    return global.logger.debugWarn(`Command ${chalk.redBright(path.basename(filePath))} was modified, but the cooldown is still active for ${chalk.redBright((250 - (new Date().getTime() - updateCooldown.get(filePath))))} ms.`, this.fileName)
                }
                updateCooldown.set(filePath, new Date().getTime())
                const fileContents = fs.readFileSync(filePath).toString()

                const fileHash = crypto.createHash("md5").update(fileContents).digest("hex")
                const handlerHash = responsibleHandler.fileHash

                if (fileHash == handlerHash) {
                    global.logger.debug(`Command ${chalk.greenBright(responsibleHandler.constructor.name)} was modified, but the hash is the same.`, this.fileName)
                    return
                }

                const handler = responsibleHandler as IRISCommand
                const unloadResult = await unloadHandler(handler.commandSettings.unloadTimeoutMS??IRISCommand.defaultUnloadTimeoutMS, handler, client, "reload")
                delete global.requiredModules[`cmd${handler.constructor.name}`]
                if (unloadResult == "timeout") {
                    global.logger.error(`Command ${chalk.redBright(handler.constructor.name)} failed to unload within the ${chalk.yellowBright(handler.commandSettings.unloadTimeoutMS??IRISCommand.defaultUnloadTimeoutMS)} ms timeout.`, this.fileName)
                    return
                }
                console.log(filePath)
                console.log(fs.existsSync(filePath))
                const newHandlerClass = (await import(filePath)).default
                const newHandler = new newHandlerClass(client) as IRISCommand
                newHandler.cache = handler.cache
                await newHandler.validateCache()
                await newHandler.setupSubCommands(client)
                const setupResult = await setupHandler(newHandler.commandSettings.setupTimeoutMS??IRISCommand.defaultSetupTimeoutMS, newHandler, client, "reload")
                if (setupResult == "timeout") {
                    global.logger.error(`Command ${chalk.redBright(newHandler.constructor.name)} failed to setup within the ${chalk.yellowBright(newHandler.commandSettings.setupTimeoutMS??IRISCommand.defaultSetupTimeoutMS)} ms timeout.`, this.fileName)
                    return
                }
                global.requiredModules[`cmd${newHandler.constructor.name}`] = newHandler
                if (handler?.slashCommand?.toJSON() != newHandler?.slashCommand?.toJSON()) {
                    const newCommands = Object.keys(global.requiredModules).filter(a=>a.startsWith("cmd")).map(key => global.requiredModules[key].slashCommand.toJSON())
                    global.reload.commands = newCommands
                    await reloadCommands(client, newCommands)
                }
                global.logger.log(`Command ${chalk.greenBright(newHandler.constructor.name)} has been reloaded.`, this.fileName)
            })
        })

        eventWatcher.on("ready", () => {
            global.logger.log(`Event watcher is ${chalk.greenBright("ready")}.`, this.fileName)
        
            eventWatcher.on("rename", async (oldPath, newPath)=>{
                if (!newPath.endsWith(".evt.js") && !oldPath.endsWith(".evt.js") || !ready) return;

                if (oldPath.endsWith(".evt.js") && !newPath.endsWith(".evt.js")) {
                    eventWatcher.emit("unlink", oldPath)
                    return
                }

                if (!oldPath.endsWith(".evt.js") && newPath.endsWith(".evt.js")) {
                    eventWatcher.emit("add", newPath)
                    return
                }
                const responsibleHandler = global.requiredModules[
                    Object.keys(global.requiredModules).filter(a=>a.startsWith("event")).find(key => global.requiredModules[key].fileName == path.basename(oldPath))
                ]
                if (!responsibleHandler) return
                
                
                const antiCacheValue = new Date().getTime().toString()
                const newHandlerClass = (await import(newPath + "?_="+antiCacheValue)).default
                const oldPathClassName = responsibleHandler.constructor.name
                const newHandlerClassName = newHandlerClass.name
                
                if (oldPathClassName == newHandlerClassName) {
                    global.logger.debug(`The file containing event ${chalk.yellowBright(oldPathClassName)} (${chalk.yellowBright(path.basename(oldPath))}) was renamed to ${chalk.yellowBright(path.basename(newPath))}. Reloading...`, this.fileName)

                    if (responsibleHandler.type == "onStart" && !responsibleHandler.canBeReloaded) {
                        global.logger.warn(`Event ${chalk.redBright(responsibleHandler.constructor.name)} is an ${chalk.yellowBright("onStart")} event and has ${chalk.yellowBright("_canBeReloaded")} set to false. This event cannot be reloaded.`, this.fileName)
                        return
                    }

                    //! Unload the old handler
                    const removedHandler = responsibleHandler as IRISEvent
                    const newHandler = new newHandlerClass() as IRISEvent
                    if (newHandler.type == "onStart" && !responsibleHandler.canBeReloaded) {
                        global.logger.warn(`Event ${chalk.redBright(newHandler.constructor.name)} has become an ${chalk.yellowBright("onStart")} event and has ${chalk.yellowBright("_canBeReloaded")} set to false. This event cannot be loaded using automatic compilation.`, this.fileName)
                        return
                    }

                    if (newHandler.type != removedHandler.type) {
                        global.logger.warn(`Event ${chalk.redBright(newHandler.constructor.name)} has changed its type from ${chalk.yellowBright(removedHandler.type)} to ${chalk.yellowBright(newHandler.type)} and cannot be reloaded.`, this.fileName)
                        return
                    }

                    const unloadResult = await unloadHandler(removedHandler.eventSettings.unloadTimeoutMS??IRISEvent.defaultUnloadTimeoutMS, removedHandler, client, "reload")
                    delete global.requiredModules[`event${removedHandler.constructor.name}`]
                    if (unloadResult == "timeout") {
                        global.logger.error(`Event ${chalk.redBright(removedHandler.constructor.name)} failed to unload within the ${chalk.yellowBright(removedHandler.eventSettings.unloadTimeoutMS??IRISEvent.defaultUnloadTimeoutMS)} ms timeout.`, this.fileName)
                        return
                    }
                    newHandler.cache = removedHandler.cache
                    await newHandler.validateCache()
                    const setupResult = await setupHandler(newHandler.eventSettings.setupTimeoutMS??IRISEvent.defaultSetupTimeoutMS, newHandler, client, "reload")
                    if (setupResult == "timeout") {
                        global.logger.error(`Event ${chalk.redBright(newHandler.constructor.name)} failed to setup within the ${chalk.yellowBright(newHandler.eventSettings.setupTimeoutMS??IRISEvent.defaultSetupTimeoutMS)} ms timeout.`, this.fileName)
                        return
                    }
                    global.requiredModules[`event${newHandler.constructor.name}`] = newHandler

                    await updateEvents(removedHandler, newHandler)
                    global.logger.log(`Event ${chalk.greenBright(newHandler.constructor.name)} (${newHandler.type}) has been reloaded.`, this.fileName)
                    if (newHandler.type == "onStart") {
                        await newHandler.runEvent(client, "reload")
                    }
                }
            })

            eventWatcher.on("unlink", async (filePath)=>{
                if (!filePath.endsWith(".evt.js") || !ready) return;
                const responsibleHandler = global.requiredModules[
                    Object.keys(global.requiredModules).filter(a=>a.startsWith("event")).find(key => global.requiredModules[key].fileName == path.basename(filePath))
                ]
                if (!responsibleHandler) return
                global.logger.debug(`The file containing event ${chalk.yellowBright(responsibleHandler.constructor.name)} was deleted. Removing event...`, this.fileName)
                const handler = responsibleHandler as IRISEvent
                await removeCaller(handler)
                const unloadResult = await unloadHandler(handler.eventSettings.unloadTimeoutMS??IRISEvent.defaultUnloadTimeoutMS, handler, client, null)
                delete global.requiredModules[`event${handler.constructor.name}`]
                if (unloadResult == "timeout") {
                    global.logger.error(`Event ${chalk.redBright(handler.constructor.name)} failed to unload within the ${chalk.yellowBright(handler.eventSettings.unloadTimeoutMS??IRISEvent.defaultUnloadTimeoutMS)} ms timeout.`, this.fileName)
                    return
                }
                global.logger.log(`Event ${chalk.redBright(handler.constructor.name)} has been removed.`, this.fileName)
            })

            eventWatcher.on("add", async (filePath)=>{
                if (!filePath.endsWith(".evt.js") || !ready) return;
                try {
                    const antiCacheValue = new Date().getTime().toString()
                    const newHandlerClass = (await import(filePath + "?_="+antiCacheValue)).default

                    global.logger.debug(`A new file containing event ${chalk.yellowBright(newHandlerClass.name??"Unknown")} (${chalk.yellowBright(path.basename(filePath))}) was detected. Loading...`, this.fileName)

                    if (Object.keys(global.requiredModules).includes(`event${newHandlerClass.name}`)) {
                        const conflictedFile = global.requiredModules[`event${newHandlerClass.name}`].fileName
                        global.logger.error(`Event ${chalk.redBright(path.basename(filePath))} failed to load due to a name conflict with ${chalk.redBright(conflictedFile)}.`, this.fileName)
                        return
                    }
                    const newHandler = new newHandlerClass() as IRISEvent
                    if (newHandler.type == "onStart" && !newHandler.canBeReloaded) {
                        global.logger.warn(`Event ${chalk.redBright(newHandler.constructor.name)} is an ${chalk.yellowBright("onStart")} event and has ${chalk.yellowBright("_canBeReloaded")} set to false. This event cannot be loaded using automatic compilation.`, this.fileName)
                        return
                    }
                    const setupResult = await setupHandler(newHandler.eventSettings.setupTimeoutMS??IRISEvent.defaultSetupTimeoutMS, newHandler, client, "duringRun")
                    if (setupResult == "timeout") {
                        global.logger.error(`Event ${chalk.redBright(newHandler.constructor.name)} failed to setup within the ${chalk.yellowBright(newHandler.eventSettings.setupTimeoutMS??IRISEvent.defaultSetupTimeoutMS)} ms timeout.`, this.fileName)
                        return
                    }
                    global.requiredModules[`event${newHandler.constructor.name}`] = newHandler
                    await addCaller(newHandler)
                    global.logger.log(`Event ${chalk.greenBright(newHandler.constructor.name)} has been loaded.`, this.fileName)
                } catch (e) {
                    global.logger.error(`Event ${chalk.redBright(path.basename(filePath))} failed to load due to invalid syntax: ${e.toString()}`, this.fileName)
                }
            })

            eventWatcher.on("change", async (filePath) => {
                if (!filePath.endsWith(".evt.js") || !ready) return;
                const antiCacheValue = new Date().getTime().toString()
                const responsibleHandler = global.requiredModules[
                    Object.keys(global.requiredModules).filter(a=>a.startsWith("event")).find(key => global.requiredModules[key].fileName == path.basename(filePath))
                ]  
                if (!responsibleHandler) return

                global.logger.debug(`A change was detected in the file containing event ${chalk.yellowBright(responsibleHandler.constructor.name)} (${chalk.yellowBright(path.basename(filePath))}). Reloading...`, this.fileName)

                if (updateCooldown.has(filePath) && new Date().getTime() - updateCooldown.get(filePath) < 250) {
                    return global.logger.debugWarn(`Event ${chalk.redBright(path.basename(filePath))} was modified, but the cooldown is still active for ${chalk.redBright((250 - (new Date().getTime() - updateCooldown.get(filePath))))} ms.`, this.fileName)
                }
                updateCooldown.set(filePath, new Date().getTime())

                const fileContents = fs.readFileSync(filePath).toString()
                const fileHash = crypto.createHash("md5").update(fileContents).digest("hex")
                const handlerHash = responsibleHandler.hash
                if (fileHash == handlerHash) {
                    global.logger.debug(`Event ${chalk.greenBright(responsibleHandler.constructor.name)} was modified, but the hash is the same.`, this.fileName)
                    return
                }

                if (responsibleHandler.type == "onStart" && !responsibleHandler.canBeReloaded) {
                    global.logger.warn(`Event ${chalk.redBright(responsibleHandler.constructor.name)} is an ${chalk.yellowBright("onStart")} event and has ${chalk.yellowBright("_canBeReloaded")} set to false. This event cannot be reloaded.`, this.fileName)
                    return
                } 

                const handler = responsibleHandler as IRISEvent
                const unloadResult = await unloadHandler(handler.eventSettings.unloadTimeoutMS??IRISEvent.defaultUnloadTimeoutMS, handler, client, "reload")
                delete global.requiredModules[`event${handler.constructor.name}`]
                if (unloadResult == "timeout") {
                    global.logger.error(`Event ${chalk.redBright(handler.constructor.name)} failed to unload within the ${chalk.yellowBright(handler.eventSettings.unloadTimeoutMS??IRISEvent.defaultUnloadTimeoutMS)} ms timeout.`, this.fileName)
                    return
                }
                const newHandlerClass = (await import(filePath + "?_="+antiCacheValue)).default
                const newHandler = new newHandlerClass() as IRISEvent
                newHandler.cache = handler.cache
                await newHandler.validateCache()
                const setupResult = await setupHandler(newHandler.eventSettings.setupTimeoutMS??IRISEvent.defaultSetupTimeoutMS, newHandler, client, "reload")
                if (setupResult == "timeout") {
                    global.logger.error(`Event ${chalk.redBright(newHandler.constructor.name)} failed to setup within the ${chalk.yellowBright(newHandler.eventSettings.setupTimeoutMS??IRISEvent.defaultSetupTimeoutMS)} ms timeout.`, this.fileName)
                    return
                }
                global.requiredModules[`event${newHandler.constructor.name}`] = newHandler
                await updateEvents(handler, newHandler)
                global.logger.log(`Event ${chalk.greenBright(newHandler.constructor.name)} (${newHandler.type}) has been reloaded.`, this.fileName)
                if (newHandler.type == "onStart") {
                    await newHandler.runEvent(client, "reload")
                }
            })
        })   


        async function removeCaller(handler:IRISEvent) {
            if (handler.type == "runEvery") {
                clearInterval(global.eventInfo.get(handler.constructor.name).timeout)
            } else if (handler.type == "discordEvent") {
                console.log(handler.constructor.name)
                client.off(handler.listenerKey as any, global.eventInfo.get(handler.constructor.name).listenerFunction)
            }
            global.eventInfo.delete(handler.constructor.name)
        }


        async function addCaller(handler:IRISEvent, additional?:{
            willStrikeNextAt?: number
        }) {
            const eventType = chalk.yellowBright(handler.type)
            const eventName = chalk.blueBright(handler.fileName)
            if (handler.type == "runEvery") {
                const prettyInterval = chalk.hex("#FFA500")(prettyMilliseconds(handler.ms,{verbose: true}))
                const timeLeftUntilNext = (additional?.willStrikeNextAt ?? Date.now()) - Date.now()

                const t = setTimeout(async () => {
                    global.eventInfo.set(handler.constructor.name, {
                        timeout: setInterval(async () => {
                            if (!handler.running) {
                                /* prettier-ignore */
                                global.logger.debug(`Running '${eventType} (${prettyInterval})' event: ${eventName}`,"index.js");
                                await handler.runEvent(client);
                              } else {
                                /* prettier-ignore */
                                global.logger.debugError(`Not running '${eventType} (${prettyInterval})' event: ${eventName} reason: Previous iteration is still running.`, "index.js");
                              }
                        }, handler.ms),
                        now: Date.now(),
                        type: handler.type
                    })
                }, additional?.willStrikeNextAt ? timeLeftUntilNext : 0)

                if (additional?.willStrikeNextAt) {
                    global.eventInfo.set(handler.constructor.name, {
                        timeout: t,
                        now: Date.now(),
                        type: handler.type
                    })
                }
            } else if (handler.type == "discordEvent") {
                global.eventInfo.set(handler.constructor.name, {
                    type: handler.type,
                    listenerFunction: async (...args) => {
                        if (handler.listenerKey != Events.MessageCreate)
                            global.logger.debug(`Running '${chalk.yellowBright(handler.type)}' event: ${chalk.blueBright(handler.fileName)}`,"index.js");
                        await handler.runEvent(...args);
                    },
                    listenerKey: handler.listenerKey
                })
                client.on(handler.listenerKey as any, global.eventInfo.get(handler.constructor.name).listenerFunction)
            } else if (handler.type == "onStart") {
                await handler.runEvent(client, "reload")
            }
        }

        async function updateEvents(oldHandler:IRISEvent, newHandler:IRISEvent) {
            if (oldHandler.type == "runEvery" && newHandler.type == "runEvery") {
                let willStrikeNextAt = null
                const startedAt = global.eventInfo[oldHandler.constructor.name].now
                const interval = oldHandler.ms ?? newHandler.ms
                while (willStrikeNextAt < Date.now()) {
                    willStrikeNextAt = startedAt + interval
                }

                if (oldHandler.ms != newHandler.ms) {
                    await removeCaller(oldHandler)
                    await addCaller(newHandler);
                } else {
                    await removeCaller(oldHandler)
                    await addCaller(newHandler, {willStrikeNextAt})
                }
            } else if (oldHandler.type == "discordEvent" && newHandler.type == "discordEvent") {
                await removeCaller(oldHandler)
                await addCaller(newHandler)
            }
        }
    }
    
}

async function importFresh(modulePath) {
    const cacheBustingModulePath = `${modulePath}?update=${Date.now()}`
    return (await import(cacheBustingModulePath)).default
  }
