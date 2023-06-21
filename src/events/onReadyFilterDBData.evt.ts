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
export async function runEvent(client: Discord.Client, RM: object) {
  const dbclient = new MongoClient(global.mongoConnectionString);
  try {
    const database = dbclient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
    const userdata = database.collection(
      global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
    );
    /*
     * We remove all members from the database that are not in the server. This is to prevent the database from getting too large and bloated.
     * This is done on startup to ensure that the database is always clean and up-to-date.
     *
     * We're awaiting the result of the find() function, because we don't want to accidentally let other modules access and modify the database before we're done cleaning it.
     */
    await userdata
      .find()
      .toArray()
      .then(async (userInfo) => {
        let IDsToRemove = [];
        let memberIDs = [];
        client.guilds
          .fetch(global.app.config.mainServer)
          .then(async (guild) => {
            guild.members.fetch().then((members) => {
              members.forEach((member) => {
                memberIDs.push(member.id);
              });
              for (let data of userInfo) {
                if (!memberIDs.includes(data.id)) {
                  IDsToRemove.push({ id: data.id });
                }
              }
              if (IDsToRemove.length > 0) {
                userdata
                  .deleteMany({
                    $or: IDsToRemove,
                  })
                  .then((result) => {
                    /* prettier-ignore */
                    global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+"Successfully removed "+chalk.yellow(result.deletedCount)+" "+(result.deletedCount>1||result.deletedCount<1?"entries":"entry")+" from the database.");
                    dbclient.close();
                  });
              } else {
                dbclient.close();
              }
            });
          });
      });
  } catch {
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
export const priority = () => 10;
