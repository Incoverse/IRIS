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
import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";
import { IRISEventTypes, IRISEvent, IRISEventTypeSettings, IRISEventSettings } from "@src/lib/base/IRISEvent.js";
import storage from "@src/lib/utilities/storage.js";

import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;


const execPromise = promisify(exec);
export default class MonitorMongoDB extends IRISEvent {
  protected _type: IRISEventTypes = "runEvery"
  protected _typeSettings: IRISEventTypeSettings = {
    ms: 5 * 60 * 1000, // 5 minutes
    runImmediately: true,
  };
  protected _eventSettings: IRISEventSettings = {
    mainOnly: true,
    devOnly: false,
  };

  public async runEvent(client: Discord.Client): Promise<void> {
    try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(this._type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(this.fileName)}`, "index.js"); } catch (e) {}

    this._running = true;
    // -----------
    if (existsSync("./mongodb.restart") && storage.method == "mongo") {
      unlinkSync("./mongodb.restart");
      global.mongoStatus = global.mongoStatuses.RESTARTING;
      global.logger.debug(
        `Restart of MongoDB has been requested and is in progress.`, this.fileName
      );
      global.logger.debug(
        `Waiting few seconds to let other commands finish...`, this.fileName
      );
      await this.sleep(3000);
      global.logger.debug(
        `Restarting MongoDB...`, this.fileName
      );
      await execPromise("sudo systemctl restart mongod");
      await this.sleep(500);
      try {
        await execPromise(
          "systemctl status mongod | grep 'active (running)' "
        );
      } catch (e) {
        /* prettier-ignore */
        global.logger.debugError(chalk.red("MongoDB failed to start!"), this.fileName);
        global.mongoStatus = global.mongoStatuses.FAILED;
        return;
      }
      global.mongoStatus = global.mongoStatuses.RUNNING;
      global.logger.debug(chalk.greenBright("MongoDB successfully started back up!"), this.fileName);
    }
    // -----------
    this._running = false;
  }

  private sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}