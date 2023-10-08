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

import Discord from "discord.js";
import { existsSync, unlinkSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { IRISGlobal } from "../interfaces/global.js";
import { check } from "diskusage";
const eventInfo = {
  type: "runEvery",
  ms: 1800000, // 30 minutes
  runImmediately: false,
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export let running = false;
export const setup = async (client:Discord.Client, RM: object) => {

    // make sure "data" folder exists
    if (!existsSync("./data")) {
      global.logger.debug(
        `Creating "${chalk.cyanBright("data")}" folder...`, returnFileName()
      );
      mkdirSync("./data");
    }
    // make sure there is at least 50 MB of free space
    const disk = await check("./data");
    if (disk.available < 5000000) {
      global.logger.debugError(
        `There is less than 5 MB of free space on the disk. This event will not proceed.`, returnFileName()
      );
        return false;
    }
    return true;

}
export async function runEvent(client: Discord.Client, RM: object) {
  try {
      if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); 
  } catch (e) {}
  running = true;
  // -----------
    const date = new Date();
    // floor this time to the closest 30 minutes, e.g 12:45 -> 12:30, 12:15 -> 12:00, 13:59 -> 13:30, 14:00 -> 14:00
    date.setMinutes(date.getMinutes() - (date.getMinutes() % 30));
    // set seconds and milliseconds to 0
    date.setSeconds(0);
    date.setMilliseconds(0);
    const dateString = date.toISOString();

    // load data file (data/<year>.json)
    let data: null| Object = null;
    if (existsSync(`./data/${date.getFullYear()}.json`)) {
      data = JSON.parse(
        readFileSync(
          `./data/${date.getFullYear()}.json`,
          "utf8"
        )
      );
    } else {
        // create data file
        writeFileSync(`./data/${date.getFullYear()}.json`, "{}");
        data = {};
    }
    if (!data) data = {};
    // load data for this date
    if (!data[dateString]) data[dateString] = {};
    const joins = global.loggingData.joins.length
    const leaves = global.loggingData.leaves.length
    const messages = global.loggingData.messages.length
    const members = await client.guilds.fetch(global.app.config.mainServer).then((guild) => guild.memberCount)
    const online = await client.guilds.fetch(global.app.config.mainServer).then(async (guild) => (await guild.members.fetch()).filter((member) => member?.presence?.status && member?.presence?.status !== Discord.PresenceUpdateStatus.Offline).size)
    // if previous data for this date exists, add to it
    // e.g previous has 4 joins, new has 3 joins, total is 7
    if (data[dateString].joins) data[dateString].joins += joins;
    else data[dateString].joins = joins;
    if (data[dateString].leaves) data[dateString].leaves += leaves;
    else data[dateString].leaves = leaves;
    if (data[dateString].messages) data[dateString].messages = messages;
    else data[dateString].messages = messages;
    data[dateString].members = members;
    data[dateString].online = online;
    
    // the data structure is as follows:
    // {
    //   "2021-10-01T11:30:00.000Z": {
    //     joins: 4,
    //     leaves: 3,
    //     members: 123,
    //     online: 75
    //   }
    // }
    
    // save data
    writeFileSync(`./data/${date.getFullYear()}.json`, JSON.stringify(data));
    // clear logging data
    global.loggingData.joins = [];
    global.loggingData.leaves = [];
    global.loggingData.messages = [];

    // hours in a year: 8760, 30 minutes in an hour: 2, 8760 * 2 = 17520
    //
    // Each entry is roughly 71 bytes, 17520 * 71 = 1243920 bytes = 1.24 MB per year
    // Each entry (minimized) is roughly 57 bytes, 17520 * 57 = 997440 bytes = 0.99 MB per year





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
export const priority = () => 0;
export const getMS = () => eventInfo.ms;
export const runImmediately = () => eventInfo.runImmediately;
