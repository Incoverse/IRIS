const eventInfo = {
  type: "onMessage",
};

let Discord = require("discord.js");
let moment = require("moment-timezone");

const { MongoClient } = require("mongodb");
/**
 *
 * @param {Discord.Message} message
 * @param {*} RM
 */
async function runEvent(message, RM) {
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
module.exports = {
  runEvent,
  returnFileName: () => __filename.split("/")[__filename.split("/").length - 1],
  eventType: () => eventInfo.type,

  priority: () => 0,
};
