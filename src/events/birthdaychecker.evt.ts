import Discord from "discord.js";
import { existsSync, unlinkSync } from "fs";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import { IRISGlobal } from "../interfaces/global.js";

const eventInfo = {
  type: "onStart",
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export let running = false;
export async function runEvent(client: Discord.Client, RM: object) {
  running = true;
  const dbclient = new MongoClient(global.mongoConnectionString);
  try {
    const database = dbclient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
    const userdata = database.collection(
      global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
    );

    const guild = await client.guilds.fetch(global.app.config.mainServer);
    const roleToRemove = "It's my birthday!"; // Change this to the exact role name

    await guild.members.fetch().then(async (members) => {
      for (const member of members.values()) {
        const memberData = await userdata.findOne({ id: member.id });
        if (memberData && memberData.birthdayRoleTimestamp) {
          const currentTime = moment();
          const roleTimestamp = moment(memberData.birthdayRoleTimestamp);
          const duration = moment.duration(currentTime.diff(roleTimestamp));

          if (
            member.roles.cache.some((role) => role.name === roleToRemove) &&
            duration.asHours() >= 24.5 // 24 hours and 30 minutes
          ) {
            // Remove the role
            await member.roles.remove(roleToRemove);
          }
        }
      }
    });
  }finally {
    // Close the database client
    dbclient.close();
  }

  running = false;
}



export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 0;
