import Discord from "discord.js";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";
import chalk from "chalk";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";

const eventInfo = {
  type: "discordEvent",
  listenerkey: Discord.Events.GuildMemberRemove,
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export async function runEvent(RM: object, ...args: Array<Discord.GuildMember>) {
  if (args[0].user.bot) return;
  if (args[0].guild.id !== global.app.config.mainServer) return;
  const client = new MongoClient(global.mongoConnectionString);
  try {
    const database = client.db("IRIS");
    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );
    const result = await userdata.deleteOne({ id: args[0].id });
    /* prettier-ignore */
    global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+ chalk.yellow(args[0].user.tag) + " has left the server." + (result.deletedCount>0 ? " Their entry has been removed from the database.":""))
  } finally {
    await client.close();
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const priority = () => 0;
export const getListenerKey = () => eventInfo.listenerkey;
