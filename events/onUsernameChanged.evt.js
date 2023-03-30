let Discord = require("discord.js");
const eventInfo = {
  type: "discordEvent",
  listenerkey: Discord.Events.UserUpdate,
};
let moment = require("moment-timezone");
const { MongoClient } = require("mongodb");
/**
 *a
 * @param {Array<Discord.User>} args
 * @param {*} RM
 */
async function runEvent(RM, ...args) {
  const oldUser = args[0];
  const newUser = args[1];
  const guild = await newUser.client.guilds.fetch(global.app.config.mainServer);
  if (!(await guild.members.fetch()).has(oldUser.id)) return;
  global.app.debugLog(
    global.chalk.white.bold(
      "[" + moment().format("M/D/y HH:mm:ss") + "] [" + returnFileName() + "] "
    ) +
      global.chalk.yellow(oldUser.tag) +
      " changed their username/tag to " +
      global.chalk.yellow(newUser.tag) +
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
function eventType() {
  return eventInfo.type;
}
function returnFileName() {
  return __filename.split("/")[__filename.split("/").length - 1];
}
function getListenerKey() {
  return eventInfo.listenerkey;
}

module.exports = {
  runEvent,
  returnFileName,
  eventType,
  getListenerKey,
};
