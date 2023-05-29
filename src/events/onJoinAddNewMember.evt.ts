/*
  * Copyright (c) 2023 Inimi | InimicalPart | InCo
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
import { IRISGlobal } from "../interfaces/global.js";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";
import chalk from "chalk";
import { fileURLToPath } from "url";

const eventInfo = {
  type: "discordEvent",
  listenerkey: Discord.Events.GuildMemberAdd,
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export async function runEvent(RM: object, ...args: Array<Discord.GuildMember>) {
  if (args[0].user.bot) return;
  if (args[0].guild.id !== global.app.config.mainServer) return;

  const guild = await args[0].client.guilds.fetch(global.app.config.mainServer);
  let newMembersRole = null;
  await guild.roles.fetch().then(async (roles) => {
    roles.forEach((role) => {
      if (role.name.toLowerCase().includes("new member")) {
        newMembersRole = role;
      }
    });
  });
  args[0].roles.add(newMembersRole);
  if (!global.newMembers.includes(args[0].id))
    global.newMembers.push(args[0].id);
  const dbclient = new MongoClient(global.mongoConnectionString);
  try {
    const database = dbclient.db("IRIS");
    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );
    const entry = {...global.app.config.defaultEntry, ...{
      id: args[0].id,
      discriminator: args[0].user.discriminator,
      last_active: new Date().toISOString(),
      username: args[0].user.username,
      isNew: true,
    }}
    await userdata.insertOne(entry);
    /* prettier-ignore */
    global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+ chalk.yellow(args[0].user.tag) + " has joined the server. A database entry has been created for them.")
  } finally {
    await dbclient.close();
  }
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const eventType = () => eventInfo.type;
export const priority = () => 0;
export const getListenerKey = () => eventInfo.listenerkey;