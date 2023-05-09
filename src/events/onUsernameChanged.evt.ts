import Discord from "discord.js";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";
import chalk from "chalk";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";

const eventInfo = {
  type: "discordEvent",
  listenerkey: Discord.Events.UserUpdate,
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
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
  global.app.debugLog(
    chalk.white.bold(
      "[" +
        moment().format("M/D/y HH:mm:ss") +
        "] [" +
        returnFileName() +
        "] "
    ) +
      chalk.yellow(oldUser.tag) +
      " changed their username/tag to " +
      chalk.yellow(newUser.tag) +
      "."
  );

  const dbclient = new MongoClient(global.mongoConnectionString);

  try {
    const database = dbclient.db("IRIS");
    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );
    const userInfo = await userdata.findOne({ id: oldUser.id });
    if (userInfo) {
      await userdata.updateOne(
        { id: oldUser.id },
        {
          $set: {
            username: newUser.username,
            discriminator: newUser.discriminator,
          },
        }
      );
    }
  } finally {
    await dbclient.close();
  }
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const eventType = () => eventInfo.type;
export const priority = () => 0;
export const getListenerKey = () => eventInfo.listenerkey;