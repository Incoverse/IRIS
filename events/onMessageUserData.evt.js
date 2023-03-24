const commandInfo = {
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
    let userInfo = await userdata.findOne(query);
    if (userInfo == null) {
      userInfo = {
        id: message.author.id,
        discriminator: message.author.discriminator,
        last_active: new Date().toISOString(),
        timezones: [],
        username: message.author.username,
        approximatedTimezone: null,
        birthday: null,
      };
      a = await userdata.insertOne(userInfo);
    } else {
      // await userdata.replaceOne({ id: message.author.id }, userInfo);
      const updateDoc = {
        $set: {
          last_active: new Date().toISOString(),
        },
      };
      console.log(await userdata.updateOne(query, updateDoc, {}));
    }
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
function eventType() {
  return commandInfo.type;
}
module.exports = {
  runEvent,
  eventType,
};
