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
  const guild = await client.guilds.fetch(global.app.config.mainServer);
  const dbclient = new MongoClient(global.mongoConnectionString);

  try {
    const database = dbclient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
    const userdata = database.collection(
      global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
    );
    let toBeAdded = [];
    let updateUsernames = {};
    /*
     * We're awaiting the result of the find() function, because we don't want to accidentally let other modules access and modify the database before we're done cleaning it.
     */
      const documents = await userdata.find().toArray();
      for (let document of documents) {
        let obj = {
          id: document.id,
          birthday: document.birthday,
          timezone: document.approximatedTimezone,
          passed: document.birthdayPassed,
        };
        if (document.birthday !== null) global.birthdays.push(obj);
        if (document.isNew) {
          if (!global.newMembers.includes(document.id))
            global.newMembers.push(document.id);
        }
      }
    await userdata
      .find()
      .toArray()
      .then(async (allDocuments) => {
        let newMembersRole = null;
        guild.roles.fetch().then(async (roles) => {
          roles.forEach((role) => {
            if (role.name.toLowerCase().includes("new member")) {
              newMembersRole = role;
            }
          });

          await guild.members.fetch().then((members) => {
            members.forEach(async (member) => {
              if (!member.user.bot && member.user.id !== client.user.id) {
                if (!allDocuments.some((m) => m.id == member.id)) {
                  const entry = {
                    ...global.app.config.defaultEntry,
                    ...{
                      id: member.id,
                      username: member.user.username,
                      isNew:
                        new Date().getTime() - member.joinedAt.getTime() <
                        7 * 24 * 60 * 60 * 1000,
                    },
                  };
                  if (
                    member.user.discriminator !== "0" &&
                    member.user.discriminator
                  ) {
                    entry.discriminator = member.user.discriminator;
                  }
                  toBeAdded.push(entry);
                } else {
                  let userDoc = allDocuments.find((m) => m.id == member.id);
                  if (
                    userDoc.username !== member.user.username ||
                    (userDoc.discriminator !== member.user.discriminator &&
                      userDoc.discriminator)
                  ) {
                    const oldUsername =                         !userDoc.discriminator
                    ? userDoc.username
                    : userDoc.username + "#" + userDoc.discriminator
                    const newUsername =                           member.user.discriminator !== "0" &&
                    member.user.discriminator
                    ? member.user.tag
                    : member.user.username
                    global.logger.debug(
                      `${chalk.yellow(oldUsername)} changed their username to ${chalk.yellow(newUsername)}.`, returnFileName()
                    );
                    updateUsernames[member.id] = {
                      username: member.user.username,
                    };
                    if (
                      member.user.discriminator !== "0" &&
                      member.user.discriminator
                    ) {
                      updateUsernames[member.id].discriminator =
                        member.user.discriminator;
                    }
                  }
                }
              }
              if (
                new Date().getTime() - member.joinedAt.getTime() <
                  7 * 24 * 60 * 60 * 1000 &&
                !member.user.bot
              ) {
                member.roles.add(newMembersRole);
                if (!global.newMembers.includes(member.id))
                  global.newMembers.push(member.id);
              }
            });
          });
          const promises = [];

          if (toBeAdded.length > 0) {
            promises.push(userdata.insertMany(toBeAdded).then((result) => {
              global.logger.debug(
                `Successfully added ${result.insertedCount} missing UserData document(s).`, returnFileName()
              );
            }))
          }
          if (Object.keys(updateUsernames).length > 0) {
            for (let k of Object.keys(updateUsernames)) {
              let unsetData = {};
              if (!updateUsernames[k].discriminator) {
                unsetData = { $unset: { discriminator: "" } };
              }
              promises.push(
                userdata.updateOne(
                  { id: k },
                  { $set: updateUsernames[k], ...unsetData }
                )
              );
            }
          }
          if (promises.length > 0) {
            Promise.all(promises).then(() => dbclient.close());
          } else {
            dbclient.close();
          }
        });
      });
  } catch {
    dbclient.close();
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 9;
