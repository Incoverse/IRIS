/*
 * Copyright (c) 2023 Inimi | InimicalPart | Incoverse
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

//! OVRD stands for Override.

import Discord, { REST, Routes } from "discord.js";
import { MongoClient } from "mongodb";
import moment from "moment-timezone";
import chalk from "chalk";
import { IRISGlobal } from "../interfaces/global.js";
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
export async function runEvent(client: Discord.Client, RM: object) {


    global.overrides.reloadCommands = async () => {
        return new Promise<boolean>(async (resolve, reject) => {
            try {
              await global.rest.put(
                Routes.applicationGuildCommands(
                  client.user.id,
                  global.app.config.mainServer
                ),
                {
                  body: global.reload.commands,
                }
              );
                resolve(true);
            } catch (error) {
              console.error(error);
                reject(false);
            }
        })
    }

    global.overrides.removeCommand = async (commandName:string, guildId:string) => {
        return new Promise<boolean>(async (resolve, reject) => {
                // message.guild.commands.fetch().then(e=>c=message.channel.send({content:"</uno:"+e.find(a=>a.name=="uno").id+">"}))

            try {
                if (commandName == "*") {
                    await global.rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: [] })
                    resolve(true);
                 } else {
                    const guild = await client.guilds.fetch(guildId);
                    if (!guild) return reject(false);
                    const command = await guild.commands.fetch();
                    const commandId = command.find(a=>a.name==commandName).id;
                    if (!commandId) return reject(false);
                    await global.rest.delete(
                        Routes.applicationGuildCommand(client.user.id, guildId, commandId)
                    )
                    
                  resolve(true);
                    
                }
            } catch (error) {
                console.error(error);
                reject(false);
            }



        })

    }








}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 8;
