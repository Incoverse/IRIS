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
      global.app.debugLog(global.chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+"Successfully cleansed database of "+global.chalk.yellow(result.deletedCount)+" "+(result.deletedCount>1||result.deletedCount<1?"entries":"entry")+".");
    }
  } finally {
    // Ensures that the client will close when you finish/error
    await dbclient.close();
  }
}

module.exports = {
  priority: () => 1,
  returnFileName: () => __filename.split("/")[__filename.split("/").length - 1],
  eventType: () => eventInfo.type,
  priority: () => 10,
  runEvent,
};
