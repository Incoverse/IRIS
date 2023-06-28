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
import { existsSync, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import chalk from "chalk";
import moment from "moment-timezone";
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
export async function runEvent(client: Discord.Client, RM: object) {
  running = true;
  // -----------
  if (existsSync("./mongodb.status")) {
    unlinkSync("./mongodb.status");
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
