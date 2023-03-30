let Discord = require("discord.js");
const eventInfo = {
  type: "discordEvent",
  listenerkey: Discord.Events.GuildMemberRemove,
};
let moment = require("moment-timezone");
const { MongoClient } = require("mongodb");
/**
 *
 * @param {Array<Discord.GuildMember>} args
 * @param {*} RM
 */
async function runEvent(RM, ...args) {
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
    global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+ global.chalk.yellow(args[0].user.tag) + " has left the server." + (result.deletedCount>0 ? " Their entry has been removed from the database.":""))
  } finally {
    await client.close();
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
