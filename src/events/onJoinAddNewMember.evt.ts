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
    let userInfo = {
      id: args[0].id,
      discriminator: args[0].user.discriminator,
      last_active: new Date().toISOString(),
      timezones: [],
      username: args[0].user.username,
      approximatedTimezone: null,
      birthday: null,
      birthdayPassed: false,

      isNew: true,
    };
    await userdata.insertOne(userInfo);
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