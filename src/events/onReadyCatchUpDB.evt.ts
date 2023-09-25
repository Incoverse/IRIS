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
export const setup = async (client: Discord.Client, RM: object) => true;
export async function runEvent(client: Discord.Client, RM: object) {
  const guild = await client.guilds.fetch(global.app.config.mainServer);
  const dbclient = new MongoClient(global.mongoConnectionString);

  try {
    const database = dbclient.db(
      global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS"
    );
    const userdata = database.collection(
      global.app.config.development
        ? "DEVSRV_UD_" + global.app.config.mainServer
        : "userdata"
    );
    let toBeEdited = [];
    /*
     * We're awaiting the result of the find() function, because we don't want to accidentally let other modules access and modify the database before we're done cleaning it.
     */
    const allDocuments = await userdata.find().toArray();
    let newMembersRole = null;
    await guild.roles.fetch().then(async (roles) => {
      roles.forEach((role) => {
        if (role.name.toLowerCase().includes("new member")) {
          newMembersRole = role;
        }
      });
    });
    const guildMembers = await guild.members.fetch();
    for (let document of allDocuments) {
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
      if (!guildMembers.map((member) => member.id).includes(document.id)) {
        toBeEdited.push({
          action: "RMV",
          id: document.id,
          username: document.username,
        });
        continue
      }
      let defaults = global.app.config.defaultEntry

      // if fields are missing, add them, if the field is an object, add the missing fields in the object as well

      function addMissingFields(obj, defaults, prefix="") {
        if (prefix!=="") prefix += "."
        let changes = {}
        for (let key in defaults) {
          if (typeof obj[key] == "object") {
            changes = {...changes, ...addMissingFields(obj[key], defaults[key], key)}
          } else if (!Object.keys(obj).includes(key)) {
            changes ={ ...changes, ...{[prefix+key]: defaults[key]} }
          }
        }
        return changes
      }

      let changes = addMissingFields(document, defaults)

      if (Object.keys(changes).length > 0) {
        toBeEdited.push({
          action: "UPD",
          id: document.id,
          username: document.username,
          changes
        })
      }
    }
    guildMembers.forEach(async (member) => {
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
          if (member.user.discriminator !== "0" && member.user.discriminator) {
            entry.discriminator = member.user.discriminator;
          }
          toBeEdited.push({ action: "ADD", entry });
        } else {
          let userDoc = allDocuments.find((m) => m.id == member.id);
          if (
            userDoc.username !== member.user.username ||
            (userDoc.discriminator !== member.user.discriminator &&
              userDoc.discriminator)
          ) {
            toBeEdited.push({
              action: "UPD_USRNAME",
              id: member.id,
              username: member.user.username,
              tag: member.user.tag,
              discriminator:
                member.user.discriminator !== "0" && member.user.discriminator
                  ? member.user.discriminator
                  : null,
            });
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
    const allActions = [];

    if (toBeEdited.length > 0) {
      let toBeRemoved = toBeEdited
        .filter((a) => a.action == "RMV")
        .map((a) => a.id);
      if (toBeRemoved.length > 0)
        allActions.push(
          userdata
            .deleteMany({
              $or: toBeRemoved,
            })
            .then((result) => {
              // const entryOrEntries =
              //   result.deletedCount > 1 || result.deletedCount < 1
              //     ? "entries"
              //     : "entry"; // if more than 1, or less than 1, use plural
              // /* prettier-ignore */
              // global.logger.debug(`Successfully removed ${chalk.yellow(result.deletedCount)} redundant ${entryOrEntries} from the database.`,returnFileName());
              toBeEdited
                .filter((a) => a.action == "RMV")
                .map((a) => a.username)
                .forEach((entry) => {
                  global.logger.debug(
                    `Removed ${chalk.yellow(
                      entry.username
                    )} from the database. (user left)`,
                    returnFileName()
                  );
                });
            })
        );

      const toBeAdded = toBeEdited
        .filter((a) => a.action == "ADD")
        .map((a) => a.entry);
      if (toBeAdded.length > 0)
        allActions.push(
          userdata.insertMany(toBeAdded).then((result) => {
            // global.logger.debug(
            //   `Successfully added ${result.insertedCount} missing UserData document(s).`,
            //   returnFileName()
            // );
            toBeAdded.forEach((entry) => {
              global.logger.debug(
                `Added ${chalk.yellow(entry.username)} to the database. (user joined)`,
                returnFileName()
              );
            });
          })
        );
      const toBeUpdated = toBeEdited.filter((a) => a.action == "UPD");
      for (let entry of toBeUpdated) {
        allActions.push(
          userdata.updateOne({ id: entry.id }, { $set: entry.changes }).then((result) => {
            global.logger.debug("Added "+chalk.yellow(Object.keys(entry.changes).length)+" missing field"+(Object.keys(entry.changes).length>1?"s":"")+" to "+chalk.yellow(entry.username) + "'" + (entry.username.toLowerCase().endsWith("s") ? "" : "s") + " entry.", returnFileName())
          })
        );
      }
      const toBeUsernameUpdate = toBeEdited.filter((a) => a.action == "UPD_USRNAME");
      for (let entry of toBeUsernameUpdate) {
        let unsetData = {};
        if (entry.discriminator == null) {
          unsetData = { $unset: { discriminator: "" } };
        }
        const oldUsername = !entry.discriminator
          ? entry.username
          : entry.username + "#" + entry.discriminator;
        const newUsername =
          entry.user.discriminator !== "0" && entry.user.discriminator
            ? entry.user.tag
            : entry.user.username;

        global.logger.debug(
          `${chalk.yellow(
            oldUsername
          )} changed their username to ${chalk.yellow(newUsername)}.`,
          returnFileName()
        );
        allActions.push(
          userdata.updateOne(
            { id: entry.id },
            { $set: { username: entry.username }, ...unsetData }
          )
        );
      }
    }
    if (allActions.length > 0) {
      Promise.all(allActions).then(() => {
        // global.logger.debug("Finished.", returnFileName());
        // console.log("A")
        dbclient.close();
      });
    } else {
      // console.log("B")
      // global.logger.debug("Finished.", returnFileName());
      dbclient.close();
    }
  } catch (error) {
    global.logger.error(error, returnFileName());
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
