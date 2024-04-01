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

import Discord from "discord.js";
import crypto from "crypto";
import nodeIPC from "node-ipc";
import moment from "moment-timezone";
import chalk from "chalk";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";

const eventInfo = {
  type: "onStart",
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export const setup = async (client:Discord.Client) => true


const socketTable = new Map()

export async function runEvent(client: Discord.Client) {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); } catch (e) {}


    function socketToIAM(socket:any) {
        return Array.from(socketTable.entries()).find(([iam, socketData]) => socketData.socket == socket)[0]
    }


    const ipcID = crypto.randomBytes(16).toString("hex");
    nodeIPC.config.id = ipcID;
    nodeIPC.config.silent = true;
    
    const socketPath = process.platform == "linux" ? process.cwd() + "/IRIS.sock" : "IRIS";

    nodeIPC.serve(socketPath, () => {
        nodeIPC.server.on("connect", (socket) => {
            let iam = crypto.randomBytes(16).toString("hex")
            while (socketTable.has(iam)) {
                iam = crypto.randomBytes(16).toString("hex")
            }
            socketTable.set(iam, {socket: socket, subscriptions: new Map()})
        })

        nodeIPC.server.on("subscribe", (data:{
            event:string
        }, socket) => {
            function parseSubscription(rcvd_data:any) {
                nodeIPC.server.emit(socket, data.event, rcvd_data)
            }
            global.communicationChannel.on(data.event, parseSubscription, returnFileName())
            socketTable.get(socketToIAM(socket)).subscriptions.set(data.event, parseSubscription)
        })

        nodeIPC.server.on("query", (data:{
            type:string,
            timeout?:number
        }, socket) => {

            const timeout = data.timeout || 5000
            const nonce = crypto.randomBytes(16).toString("hex")

            let timeoutTimeout = null;
            function queryResponseHandler(response) {
                clearTimeout(timeoutTimeout)
                nodeIPC.server.emit(socket, "query", response)
            }

            timeoutTimeout = setTimeout(() => {
                nodeIPC.server.emit(socket, "query", {message: "Query timed out", code: "QUERY_TIMEOUT"})
                global.communicationChannel.off("ipc-query-"+nonce,queryResponseHandler, returnFileName())
            }, timeout)
            global.communicationChannel.once("ipc-query-"+nonce, queryResponseHandler, returnFileName())
            global.communicationChannel.emit("ipc-query", {type: data.type, nonce: nonce}, returnFileName())

        })


        nodeIPC.server.on("unsubscribe", (data:{
            event:string
        }, socket) => {
            let iam = socketToIAM(socket)
            if (!socketTable.get(iam).subscriptions.has(data.event)) {
                nodeIPC.server.emit(socket, "unsubscribe", {message: "No subscription found", code: "NO_SUBSCRIPTION_FOUND"})
                return
            }
            global.communicationChannel.off(data.event, socketTable.get(iam).subscriptions.get(data.event), returnFileName())
            socketTable.get(iam).subscriptions.delete(data.event)
        })


        nodeIPC.server.on("socket.disconnected", (socket) => {

            let iam = socketToIAM(socket)
            for (let [event, callback] of socketTable.get(iam).subscriptions) {
                global.communicationChannel.off(event, callback, returnFileName())
            }
            socketTable.delete(iam)

        })
    })

    nodeIPC.server.start();


}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];

export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 10;
