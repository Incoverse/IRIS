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
import moment from "moment-timezone";
import { MongoClient } from "mongodb";
import chalk from "chalk";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";

const eventInfo = {
  type: "discordEvent",
  listenerkey: Discord.Events.UserUpdate,
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export const setup = async (client:Discord.Client, RM: object) => true
export async function runEvent(RM: object, ...args: Array<Discord.User>) {
  const oldUser = args[0];
  const newUser = args[1];
  const guild = await newUser.client.guilds.fetch(global.app.config.mainServer);
  if (!(await guild.members.fetch()).has(oldUser.id)) return;
  if (
    oldUser.username === newUser.username &&
    oldUser.discriminator === newUser.discriminator
  )
    return; // User changed something else, which we don't care about

  if (oldUser.discriminator !== "0" && newUser.discriminator === "0") {
    global.logger.debug(
      `${chalk.yellow(oldUser.tag)} is now using the new username system. Username: ${chalk.yellow(newUser.username)}.`,returnFileName()
    );
  } else {
    const oldUsername = oldUser.discriminator == "0" || !oldUser.discriminator
    ? oldUser.username
    : oldUser.tag
    const newUsername = newUser.discriminator == "0" || !newUser.discriminator
    ? newUser.username
    : newUser.tag
    global.logger.debug(`${chalk.yellow(oldUsername)} changed their username to ${chalk.yellow(newUsername)}.`, returnFileName());
  }

  const dbclient = new MongoClient(global.mongoConnectionString);

  try {
    const database = dbclient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
    const userdata = database.collection(
      global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
    );
    const userInfo = await userdata.findOne({ id: oldUser.id });
    const data = {
      username: newUser.username,
    };
    if (newUser.discriminator !== "0" && newUser.discriminator)
      data["discriminator"] = newUser.discriminator;
    if (userInfo) {
      await userdata.updateOne(
        { id: oldUser.id },
        {
          $set: data,
          ...(newUser.discriminator == "0" || !newUser.discriminator
            ? { $unset: { discriminator: "" } }
            : {}),
        }
      );
    }
  } finally {
    await dbclient.close();
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 0;
export const getListenerKey = () => eventInfo.listenerkey;
