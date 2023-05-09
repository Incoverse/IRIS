import { MongoClient } from "mongodb";
import Discord from "discord.js";
import { IRISGlobal } from "../interfaces/global.js"
import { fileURLToPath } from "url";

const eventInfo = {
  type: "onMessage",
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export async function runEvent(message: Discord.Message, RM: object) {
  if (message.guildId != global.app.config.mainServer) return;
  const client = new MongoClient(global.mongoConnectionString);
  if (message.author.id == message.client.user.id) return;
  try {
    const database = client.db("IRIS");
    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );
    let a;
    // Query for a movie that has the title 'Back to the Future'
    const query = { id: message.author.id };
    const updateDoc = {
      $set: {
        last_active: new Date().toISOString(),
      },
    };
    await userdata.updateOne(query, updateDoc, {});
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const eventType = () => eventInfo.type;
export const priority = () => 0;
