const eventInfo = {
  type: "runEvery",
  ms: 12 * 60 * 60 * 1000, //12h
  runImmediately: true,
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
      if (new Date().getTime() - member.joinedAt.getTime() >= 7 * 24 * 60 * 60 * 1000) {
        global.newMembers = global.newMembers.filter(
          (item) => item !== memberID
        );
        /* prettier-ignore */
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+"Removing '"+newMembersRole.name+"' (role) from "+chalk.yellow(member.user.tag));
        member.roles.remove(newMembersRole);
        updated.push(memberID);
      }
    });
    if (updated.length > 0) {
      const client = new MongoClient(global.mongoConnectionString);
      try {
        const database = client.db("IRIS");
        const userdata = database.collection(
          global.app.config.development ? "userdata_dev" : "userdata"
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
        );
      } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
      }
    }
  }
  // -----------
  running = false;
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const eventType = () => eventInfo.type;
export const priority = () => 0;
export const getMS = () => eventInfo.ms;
export const runImmediately = () => eventInfo.runImmediately;