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

import { IRISEvent, IRISEventTypeSettings, IRISEventTypes } from "@src/lib/base/IRISEvent.js";
import * as Discord from "discord.js";
import chalk from "chalk";
import crypto from "crypto";
import nodeIPC from "node-ipc";

import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;

const socketTable = new Map()

export default class OnReadySetupInfoSocket extends IRISEvent {
    protected _type: IRISEventTypes = "onStart";
    protected _priority: number = 10;
    protected _typeSettings: IRISEventTypeSettings = {};

    public async runEvent(client: Discord.Client): Promise<void> {
        try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(this._type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(this.fileName)}`, "index.js"); } catch (e) {}
        function socketToIAM(socket:any) {
            return Array.from(socketTable.entries()).find(([iam, socketData]) => socketData.socket == socket)[0]
        }


        const ipcID = crypto.randomBytes(16).toString("hex");
        nodeIPC.config.id = ipcID;
        nodeIPC.config.silent = true;
        
        const socketPath = process.platform == "win32" ? "IRIS" : "/tmp/IRIS.sock";

        nodeIPC.serve(socketPath, () => {
            nodeIPC.server.on("connect", (socket) => {
                let iam = crypto.randomBytes(16).toString("hex")
                while (socketTable.has(iam)) {
                    iam = crypto.randomBytes(16).toString("hex")
                }
                socketTable.set(iam, {socket: socket, subscriptions: new Map()})
                global.logger.debug(`New IPC socket connected: ${iam}`, "index.js")
            })

            nodeIPC.server.on("subscribe", (data:{
                verifiableNonce: string;
                event:string
            }, socket) => {
                const verifiableNonce = data.verifiableNonce || null
                function parseSubscription(rcvd_data:any) {
                    nodeIPC.server.emit(socket, data.event, {response: rcvd_data, ...(verifiableNonce ? {verifiableNonce} : {})})
                }
                global.communicationChannel.on(data.event, parseSubscription, this.fileName)
                socketTable.get(socketToIAM(socket)).subscriptions.set(data.event, parseSubscription)
            })

            nodeIPC.server.on("query", (data:{
                verifiableNonce?: string;
                type:string,
                timeout?:number,
                data:any
            }, socket) => {

                const timeout = data.timeout || 5000
                const nonce = crypto.randomBytes(16).toString("hex")
                const verifiableNonce = data.verifiableNonce || null

                let timeoutTimeout = null;
                function queryResponseHandler(type, response) {
                    clearTimeout(timeoutTimeout)
                    if (response.error) nodeIPC.server.emit(socket, "query", {type, data:null, error:response.error})
                    nodeIPC.server.emit(socket, "query", {type, data: response, ...(verifiableNonce ? {verifiableNonce} : {})})
                }

                timeoutTimeout = setTimeout(() => {
                    nodeIPC.server.emit(socket, "query", {type: data.type, message: "Query timed out", code: "QUERY_TIMEOUT", ...(verifiableNonce ? {verifiableNonce} : {})})
                    global.communicationChannel.off("ipc-query-"+nonce, queryResponseHandler.bind(null, data.type), this.fileName)
                }, timeout)
                global.communicationChannel.once("ipc-query-"+nonce, queryResponseHandler.bind(null, data.type), this.fileName)
                global.communicationChannel.emit("ipc-query", {type: data.type, nonce: nonce, data: data.data ?? null}, this.fileName)

            })


            nodeIPC.server.on("unsubscribe", (data:{
                verifiableNonce: string;
                event:string
            }, socket) => {
                const verifiableNonce = data.verifiableNonce || null
                let iam = socketToIAM(socket)
                if (!socketTable.get(iam).subscriptions.has(data.event)) {
                    nodeIPC.server.emit(socket, "unsubscribe", {message: "No subscription found", code: "NO_SUBSCRIPTION_FOUND", ...(verifiableNonce ? {verifiableNonce} : {})})
                    return
                }
                global.communicationChannel.off(data.event, socketTable.get(iam).subscriptions.get(data.event), this.fileName)
                socketTable.get(iam).subscriptions.delete(data.event)
            })


            nodeIPC.server.on("socket.disconnected", (socket) => {

                let iam = socketToIAM(socket)
                for (let [event, callback] of socketTable.get(iam).subscriptions) {
                    global.communicationChannel.off(event, callback, this.fileName)
                }
                socketTable.delete(iam)

            })
        })

        nodeIPC.server.start();
    }
}
