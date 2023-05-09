import Discord, {Team} from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("timezone")
    .setDescription("Check what timezone IRIS has predicted that you're in."),
};
export async function runCommand(interaction: Discord.CommandInteraction, RM: object) {

  try {
    await interaction.deferReply({
      ephemeral: true,
    });
    const client = new MongoClient(global.mongoConnectionString);
    try {
      const db = client.db("IRIS");
      const userdata = db.collection(
        global.app.config.development ? "userdata_dev" : "userdata"
      );
      const userinfo = await userdata.findOne({ id: interaction.user.id });
      if (!userinfo.approximatedTimezone) {
        await interaction.editReply({
          content:
            "IRIS has not predicted a timezone for you. Each time you type a message like 'timezone 12:34 am', IRIS will predict your timezone by checking which timezone matches the time that you provided.",
        });
        return;
      }
      const usersTimezone = userinfo.approximatedTimezone;
      const offset = getOffset(usersTimezone);

      await interaction.editReply({
        content:
          "IRIS has estimated your timezone to be: ``" +
          usersTimezone +
          " (" +
          offset +
          ")``. Current date & time in timezone: ``" +
          moment().tz(usersTimezone).format("MMM Do @ hh:mma") +
          "``", // Apr 2nd @ 12:17am
      });
    } finally {
      await client.close();
    }
  } catch (e) {
    console.error(e);
    await interaction.client.application.fetch();
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true
            ? "\n\n``" +
              ([
                ...Array.from(
                                  (interaction.client.application.owner as Team).members.keys()
                ),
                ...global.app.config.externalOwners,
              ].includes(interaction.user.id)
                ? e.stack.toString()
                : e.toString()) +
              "``"
            : ""),
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true
            ? "\n\n``" +
              ([
                ...Array.from(
                                  (interaction.client.application.owner as Team).members.keys()
                ),
                ...global.app.config.externalOwners,
              ].includes(interaction.user.id)
                ? e.stack.toString()
                : e.toString()) +
              "``"
            : ""),
        ephemeral: true,
      });
    }
  }
}
function getOffset(timezone) {
  let offset = moment().tz(timezone).utcOffset() / 60;
  let stringOffset = "";
  if (offset !== 0) {
    if (offset < 0) {
      stringOffset += "-";
    } else {
      stringOffset += "+";
    }
    if (offset.toString().includes(".")) {
      let fullHourOffset = Math.abs(offset)
      let minuteOffset = 60 * (Math.abs(offset) - fullHourOffset);
      stringOffset += fullHourOffset + ":" + minuteOffset;
    } else {
      stringOffset += Math.abs(offset);
    }
  }
  return "UTC" + stringOffset;
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const getSlashCommand = () => commandInfo.slashCommand;
export const commandCategory = () => commandInfo.category;