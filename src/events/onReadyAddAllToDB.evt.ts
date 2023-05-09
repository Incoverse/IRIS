import Discord from "discord.js";
import { MongoClient } from "mongodb";
import moment from "moment-timezone";
import chalk from "chalk";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";

const eventInfo = {
  type: "onStart",
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export async function runEvent(client: Discord.Client, RM: object) {
  const guild = await client.guilds.fetch(global.app.config.mainServer);
  const dbclient = new MongoClient(global.mongoConnectionString);

  try {
    const database = dbclient.db("IRIS");
    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );
    let a;
    let toBeAdded = [];
    let updateUsernames = {};
    let allDocuments = await userdata.find().toArray();
    let newMembersRole = null;
    await guild.roles.fetch().then(async (roles) => {
      roles.forEach((role) => {
        if (role.name.toLowerCase().includes("new member")) {
          newMembersRole = role;
        }
      });
    });
    await guild.members.fetch().then((members) => {
      members.forEach(async (member) => {
        if (!member.user.bot && member.user.id !== client.user.id) {
          if (!allDocuments.some((m) => m.id == member.id)) {
            toBeAdded.push({
              id: member.id,
              discriminator: member.user.discriminator,
              last_active: null,
              timezones: [],
              username: member.user.username,
              approximatedTimezone: null,
              birthday: null,
              birthdayPassed: false,
              isNew:
                new Date().getTime() - (await guild.members.fetch(member.id)).joinedAt.getTime() <
                7 * 24 * 60 * 60 * 1000,
            });
          } else {
            let userDoc = allDocuments.find((m) => m.id == member.id);
            if (
              userDoc.username !== member.user.username ||
              userDoc.discriminator !== member.user.discriminator
            ) {
              global.app.debugLog(
                chalk.white.bold(
                  "[" +
                    moment().format("M/D/y HH:mm:ss") +
                    "] [" +
                    returnFileName() +
                    "] "
                ) +
                  chalk.yellow(
                    userDoc.username + "#" + userDoc.discriminator
                  ) +
                  " changed their username/tag to " +
                  chalk.yellow(member.user.tag) +
                  "."
              );
              updateUsernames[member.id] = {
                username: member.user.username,
                discriminator: member.user.discriminator,
              };
            }
          }
        }
        if (
          new Date().getTime() - member.joinedAt.getTime() < 7 * 24 * 60 * 60 * 1000 &&
          !member.user.bot
        ) {
          member.roles.add(newMembersRole);
          if (!global.newMembers.includes(member.id))
            global.newMembers.push(member.id);
        }
      });
    });
    if (toBeAdded.length > 0) {
      global.app.debugLog(
        chalk.white.bold(
          "[" +
            moment().format("M/D/y HH:mm:ss") +
            "] [" +
            returnFileName() +
            "] "
        ) +
          "Successfully added " +
          (await userdata.insertMany(toBeAdded)).insertedCount +
          " missing UserData document(s)."
      );
    }
    if (Object.keys(updateUsernames).length > 0) {
      for (let k of Object.keys(updateUsernames)) {
        await userdata.updateOne({ id: k }, { $set: updateUsernames[k] });
      }
    }
  } finally {
    await dbclient.close();
  }
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const eventType = () => eventInfo.type;
export const priority = () => 0;
