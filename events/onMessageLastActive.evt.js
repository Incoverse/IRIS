const eventInfo = {
  type: "onMessage",
};

let Discord = require("discord.js");
const { MongoClient } = require("mongodb");
/**
 *
 * @param {Discord.Message} message
 * @param {*} RM
 */
async function runEvent(message, RM) {
  const client = new MongoClient(global.mongoConnectionString);
  if (message.author.id == message.client.user.id) return;
  try {
    const database = client.db("IRIS");
    const userdata = database.collection("userdata");
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
function eventType() {
  return eventInfo.type;
}
function returnFileName() {
  return __filename.split("/")[__filename.split("/").length - 1];
}
module.exports = {
  runEvent,
  returnFileName,
  eventType,
};
