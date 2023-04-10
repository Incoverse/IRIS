let Discord = require("discord.js");
const eventInfo = {
  type: "discordEvent",
  listenerkey: Discord.Events.GuildMemberAdd,
};
let moment = require("moment-timezone");
const { MongoClient } = require("mongodb");
/**
 *a
 * @param {Array<Discord.GuildMember>} args
 * @param {*} RM
 */
async function runEvent(RM, ...args) {
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
  global.newMembers.push(args[0].id);
  const dbclient = new MongoClient(global.mongoConnectionString);
  try {
    const database = dbclient.db("IRIS");
    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );
    userInfo = {
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
    global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+ global.chalk.yellow(args[0].user.tag) + " has joined the server. A database entry has been created for them.")
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
