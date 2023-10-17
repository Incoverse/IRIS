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

import Discord, { TextChannel } from "discord.js";
import { existsSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";
import { IRISGlobal } from "../interfaces/global.js";
const execPromise = promisify(exec);
const eventInfo = {
  type: "onStart",
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export let running = false;
export const setup = async (client:Discord.Client, RM: object) => true
export async function runEvent(client: Discord.Client, RM: object) {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); } catch (e) {}
  running = true;
  // -----------

    const mainServer = await client.guilds.fetch(global.app.config.mainServer);
    const channels = await mainServer.channels.fetch()

    //! Find and delete all UNO Chat threads
    for (let channel of channels.values()) {
        try {
            for (let thread of (channel as TextChannel).threads.cache.values()) {
                if (thread.name.includes("UNO Chat Thread") && thread.ownerId == client.user.id) {
                    let threadName = thread.name
                    thread.delete().catch((_e)=>{}).then(() => {
                        global.logger.debug(`Deleted '${chalk.yellowBright(threadName)}' (${chalk.cyanBright("thread")}) in '${chalk.yellowBright(channel.name)}' (${chalk.cyanBright("channel")}).`, returnFileName())
                    })
                }
            }
        } catch (e) {}
    }

  // -----------
  running = false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 3;