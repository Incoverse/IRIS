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
import { MongoClient } from "mongodb";
import moment from "moment-timezone";
import chalk from "chalk";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import express, { Express, Request, Response } from "express";
import { readFileSync, writeFileSync } from "fs";
import { request } from "undici";
const app: Express = express();
const port = 7380;
const eventInfo = {
  type: "onStart",
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};
let server = null;
let completed = false;
let expires_in = Number.MAX_SAFE_INTEGER
const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export const setup = async (client:Discord.Client, RM: object) => true
export async function runEvent(client: Discord.Client, RM: object) {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); } catch (e) {}

  
  const dbclient = new MongoClient(global.mongoConnectionString);
  try {
    const database = dbclient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
    const offensedata = database.collection(global.app.config.development ? "DEVSRV_OD_"+global.app.config.mainServer : "offensedata");

    const offenses = await offensedata.find({}).toArray();
    global.server.main.offenses = {...Object.keys(offenses).map((uID) => {
      return {
        [uID]: offenses[uID].offenses,
      };
    })}

    //TODO: Expand to make sure that the offenses are active. And fixing any inconsistencies.
    global.logger.debug(`Loaded ${offenses.length} offenses from the database.`, returnFileName());

  } catch (e) {
    global.logger.error(e, returnFileName());
  } finally {
    dbclient.close();
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 5;
