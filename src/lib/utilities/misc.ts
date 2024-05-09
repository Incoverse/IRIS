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
import { Client, Routes } from "discord.js";
import { fileURLToPath } from "url";
import { IRISEvent } from "../base/IRISEvent.js";
import { IRISCommand } from "../base/IRISCommand.js";

declare const global: IRISGlobal;

export async function reloadCommands(client: Client, commands = Object.keys(global.requiredModules).filter(a => a.startsWith("cmd")).map(cmdKey => global.requiredModules[cmdKey].slashCommand.toJSON()) ) {
    return new Promise<boolean>(async (resolve, reject) => {
        try {
          await global.rest.put(
            Routes.applicationGuildCommands(
              client.user.id,
              global.app.config.mainServer
            ),
            {
              body: commands
            }
          );
          resolve(true);
        } catch (error) {
          global.logger.error(error, returnFileName());
          reject(false);
        }
    })
}

function returnFileName() {
  const __filename = fileURLToPath(import.meta.url);
  const separator = __filename.includes("/") ? "/" : "\\";
  return __filename.split(separator).pop();
}

export async function removeCommand(client, commandName:string) {
  return new Promise<boolean>(async (resolve, reject) => {
      try {
          if (commandName == "*") {
            await global.rest.put(Routes.applicationGuildCommands(client.user.id, global.app.config.mainServer), { body: [] })
            resolve(true);
          } else {
            const guild = await client.guilds.fetch(global.app.config.mainServer);
            if (!guild) return reject(false);
            const command = await guild.commands.fetch();
            const commandId = command.find(cmd=>cmd.name == commandName).id;
            if (!commandId) return reject(false);
            await global.rest.delete(Routes.applicationGuildCommand(client.user.id, global.app.config.mainServer, commandId))
            resolve(true);
          }
      } catch (error) {
        global.logger.error(error, returnFileName());
        reject(false);
      }
  })
}

export async function addCommand(client: Client, command: any) {
  return new Promise<boolean>(async (resolve, reject) => {
      try {
          await global.rest.post(
            Routes.applicationGuildCommands(
              client.user.id,
              global.app.config.mainServer
            ),
            {
              body: command
            }
          );
          resolve(true);
      } catch (error) {
        global.logger.error(error, returnFileName());
        reject(false);
      }
  })
}


export async function unloadHandler(timeout: number, handler: IRISEvent | IRISCommand, client: Client, reason?: "reload" | "shuttingDown") {
  return await Promise.race([
      new Promise((resolve) => {
          handler.unload(client, reason).then((...args)=>{
              handler._loaded = false
              resolve(args)
          })
      }),
      new Promise((resolve) => {
          setTimeout(resolve, timeout, "timeout")
      })
  ])
}

export async function setupHandler(timeout: number, handler: IRISEvent | IRISCommand, client: Client, reason?: "reload" | "startup" | "duringRun") {
  return await Promise.race([
      new Promise((resolve) => {
          handler.setup(client, reason).then((...args)=>{
              handler._loaded = true
              resolve(args)
          })
      }),
      new Promise((resolve) => {
          setTimeout(resolve, timeout, "timeout")
      })
  ])
}