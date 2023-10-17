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
export const setup = async (client:Discord.Client, RM: object) => true
export async function runEvent(client: Discord.Client, RM: object) {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); } catch (e) {}
  const dbclient = new MongoClient(global.mongoConnectionString);
  try {
    const database = dbclient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
    try {
        await database.createCollection(global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata")
        /* prettier-ignore */
        global.logger.debug(`Successfully created a missing collection in the database: ${chalk.yellow(global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata")}`,returnFileName());

    } catch {
        /* Nothing to worry about, collection already exists */
    }
    try {
        await database.createCollection(global.app.config.development ? "DEVSRV_GD_"+global.app.config.mainServer : "gamedata")
        /* prettier-ignore */
        global.logger.debug(`Successfully created a missing collection in the database: ${chalk.yellow(global.app.config.development ? "DEVSRV_GD_"+global.app.config.mainServer : "gamedata")}`,returnFileName());
    } catch {
        /* Nothing to worry about, collection already exists */
    }
  } finally {
    // Ensures that the client will close when you finish/error
    dbclient.close();
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => Number.MAX_SAFE_INTEGER;
