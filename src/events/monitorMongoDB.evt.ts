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
import { existsSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";
import { IRISGlobal } from "../interfaces/global.js";
const execPromise = promisify(exec);
const eventInfo = {
  type: "runEvery",
  ms: 300000,
  runImmediately: true,
  settings: {
    devOnly: false,
    mainOnly: true,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export let running = false;
export const setup = async (client:Discord.Client, RM: object) => true

/*

This event is probably unnecessary for your purposes, it's purpose is to automatically restart MongoDB on the server if it finds a "mongodb.restart" file in the current directory

This was created because my MongoDB server is running with TLS and when the certificate for TLS gets renewed, MongoDB has to be restarted to use the new one

*/

export async function runEvent(client: Discord.Client, RM: object) {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); } catch (e) {}

  running = true;
  // -----------
  if (existsSync("./mongodb.restart")) {
    unlinkSync("./mongodb.restart");
    global.mongoStatus = global.mongoStatuses.RESTARTING;
    global.logger.debug(
      `Restart of MongoDB has been requested and is in progress.`, returnFileName()
    );
    global.logger.debug(
      `Waiting few seconds to let other commands finish...`, returnFileName()
    );
    await sleep(3000);
    global.logger.debug(
      `Restarting MongoDB...`, returnFileName()
    );
    await execPromise("sudo systemctl restart mongod");
    await sleep(500);
    try {
      await execPromise(
        "systemctl status mongod | grep 'active (running)' "
      );
    } catch (e) {
      /* prettier-ignore */
      global.logger.debugError(chalk.red("MongoDB failed to start!"), returnFileName());
      global.mongoStatus = global.mongoStatuses.FAILED;
      return;
    }
    global.mongoStatus = global.mongoStatuses.RUNNING;
    global.logger.debug(chalk.greenBright("MongoDB successfully started back up!"), returnFileName());
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
export const priority = () => 0;
export const getMS = () => eventInfo.ms;
export const runImmediately = () => eventInfo.runImmediately;
