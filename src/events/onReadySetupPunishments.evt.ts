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
import chalk from "chalk";
import storage from "@src/lib/utilities/storage.js";
import { IRISEvent, IRISEventTypeSettings, IRISEventTypes } from "@src/lib/base/IRISEvent.js";

import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;

export default class OnReadySetupPunishments extends IRISEvent {
  protected _type: IRISEventTypes = "onStart";
  protected _priority: number = 5;
  protected _typeSettings: IRISEventTypeSettings = {};

  public async runEvent(client: Discord.Client): Promise<void> {
    try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(this._type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(this.fileName)}`, "index.js"); } catch (e) {}

    

    try {
      const offenses = await storage.find("offense", {});

      global.server.main.offenses = {...offenses.map((uIDObj) => {
        return {
          [uIDObj.id]: uIDObj.offenses,
        };
      })}

      //TODO: Expand to make sure that the offenses are active. And fixing any inconsistencies.
      if (offenses.length > 0) global.logger.debug(`Loaded ${offenses.length} offenses from the database.`, this.fileName);

    } catch (e) {
      global.logger.error(e, this.fileName);
    }
  }
}