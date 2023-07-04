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

const eventInfo = {
  type: "runEvery",
  ms: 12 * 60 * 60 * 1000, //12h
  runImmediately: true,
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

import moment from "moment-timezone";
import Discord from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { MongoClient } from "mongodb";
import chalk from "chalk";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

export let running = false;
declare const global: IRISGlobal;

export async function runEvent(client: Discord.Client, RM: object) {
  running = true;
  // -----------
  const guild = await client.guilds.fetch(global.app.config.mainServer);
  let updated = [];
  let newMembersRole = null;
  await guild.roles.fetch().then((roles) => {
    roles.forEach((role) => {
      if (role.name.toLowerCase().includes("new member")) {
        newMembersRole = role;
      }
    });
  });
  for (let memberID of JSON.parse(JSON.stringify(global.newMembers))) {
    
    await guild.members.fetch(memberID).then(async (member) => {
      if (member.user.bot) return;
      if (
        new Date().getTime() - member.joinedAt.getTime() >=
        7 * 24 * 60 * 60 * 1000
      ) {
        global.newMembers = global.newMembers.filter(
          (item) => item !== memberID
        );
        /* prettier-ignore */
        const user = member.user.discriminator != "0" && member.user.discriminator ? member.user.tag: member.user.username
        global.logger.debug(`Removing '${newMembersRole.name}' (role) from ${chalk.yellow(user)}`,returnFileName());
        member.roles.remove(newMembersRole);
        updated.push(memberID);
      }
    });}
    if (updated.length > 0) {
      const client = new MongoClient(global.mongoConnectionString);
        const database = client.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
        const userdata = database.collection(
          global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
        );

        for (let index in updated) {
          updated[index] = { id: updated[index] };
        }
        await userdata.updateMany(
          { $or: updated },
          {
            $set: {
              isNew: false,
            },
          }
        ).then(() => {
          client.close();
        });
    }
  // -----------
  running = false;
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
