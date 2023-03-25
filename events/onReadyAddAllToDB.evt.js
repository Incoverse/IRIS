const eventInfo = {
  type: "onStart",
};

let Discord = require("discord.js");
const { MongoClient } = require("mongodb");
let moment = require("moment-timezone");
/**
 *
 * @param {Discord.Client} client
 * @param {*} RM
 */
async function runEvent(client, RM) {
  const guild = await client.guilds.fetch(global.app.mainGuild);
  const dbclient = new MongoClient(global.mongoConnectionString);

  try {
    const database = dbclient.db("IRIS");
    const userdata = database.collection("userdata");
    let a;
    let toBeAdded = [];
    let allDocuments = await userdata.find().toArray();
    let newMembersRole = null;
    await guild.roles.fetch().then(async (roles) => {
      roles.forEach((role) => {
        if (role.name.toLowerCase().includes("new member")) {
          newMembersRole = role;
        }
      });
    });
    await guild.members.fetch().then((members) => {
      members.forEach(async (member) => {
        if (!member.user.bot && member.user.id !== client.user.id) {
          if (!allDocuments.some((m) => m.id == member.id)) {
            toBeAdded.push({
              id: member.id,
              discriminator: member.user.discriminator,
              last_active: null,
              timezones: [],
              username: member.user.username,
              approximatedTimezone: null,
              birthday: null,
              isNew:
                new Date() - (await guild.members.fetch(member.id)).joinedAt <
                7 * 24 * 60 * 60 * 1000,
            });
          }
        }
        if (
          new Date() - (await guild.members.fetch(member.id)).joinedAt <
          7 * 24 * 60 * 60 * 1000
        ) {
          member.roles.add(newMembersRole);
          global.newMembers.push(member.id);
        }
      });
    });
    if (toBeAdded.length > 0) {
      global.app.debugLog(
        chalk.white.bold(
          "[" +
            moment().format("M/D/y HH:mm:ss") +
            "] [" +
            returnFileName() +
            "] "
        ) +
          "Successfully added " +
          (await userdata.insertMany(toBeAdded)).insertedCount +
          " missing UserData document(s)."
      );
    }
  } finally {
    dbclient.close();
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
