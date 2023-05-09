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
    let userInfo = await userdata.find().toArray();
    let IDsToRemove = [];
    let memberIDs = [];
    await guild.members.fetch().then((members) => {
      members.forEach((member) => {
        memberIDs.push(member.id);
      });
    });
    for (let data of userInfo) {
      if (!memberIDs.includes(data.id)) {
        IDsToRemove.push({ id: data.id });
      }
    }
    if (IDsToRemove.length > 0) {
      let result = await userdata.deleteMany({
        $or: IDsToRemove,
      });
      /* prettier-ignore */
      global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+"Successfully cleansed database of "+chalk.yellow(result.deletedCount)+" "+(result.deletedCount>1||result.deletedCount<1?"entries":"entry")+".");
    }
  } finally {
    // Ensures that the client will close when you finish/error
    await dbclient.close();
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const priority = () => 10;
