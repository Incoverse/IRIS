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
  const guild = await client.guilds.fetch(global.app.config.mainServer);
  const dbclient = new MongoClient(global.mongoConnectionString);

  try {
    const database = dbclient.db("IRIS");
    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );
    let a;
    let toBeAdded = [];
    let updateUsernames = {};
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
              birthdayPassed: false,
              isNew:
                new Date() - (await guild.members.fetch(member.id)).joinedAt <
                7 * 24 * 60 * 60 * 1000,
            });
          } else {
            let userDoc = allDocuments.find((m) => m.id == member.id);
            if (
              userDoc.username !== member.user.username ||
              userDoc.discriminator !== member.user.discriminator
            ) {
              global.app.debugLog(
                global.chalk.white.bold(
                  "[" +
                    moment().format("M/D/y HH:mm:ss") +
                    "] [" +
                    module.exports.returnFileName() +
                    "] "
                ) +
                  global.chalk.yellow(
                    userDoc.username + "#" + userDoc.discriminator
                  ) +
                  " changed their username/tag to " +
                  global.chalk.yellow(member.user.tag) +
                  "."
              );
              updateUsernames[member.id] = {
                username: member.user.username,
                discriminator: member.user.discriminator,
              };
            }
          }
        }
        if (
          new Date() - member.joinedAt < 7 * 24 * 60 * 60 * 1000 &&
          !member.user.bot
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
            module.exports.returnFileName() +
            "] "
        ) +
          "Successfully added " +
          (await userdata.insertMany(toBeAdded)).insertedCount +
          " missing UserData document(s)."
      );
    }
    if (Object.keys(updateUsernames).length > 0) {
      for (let k of Object.keys(updateUsernames)) {
        await userdata.updateOne({ id: k }, { $set: updateUsernames[k] });
      }
    }
  } finally {
    await dbclient.close();
  }
}

module.exports = {
  runEvent,
  returnFileName: () =>
    __filename.split(process.platform == "linux" ? "/" : "\\")[
      __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
    ],
  eventType: () => eventInfo.type,
  priority: () => 0,
};
