import Discord, { CommandInteractionOptionResolver, Team } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";
import moment from "moment-timezone";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
    const user = (
        interaction.options as CommandInteractionOptionResolver
      ).getUser("user", true);
      let timezone = (
        interaction.options as CommandInteractionOptionResolver
      ).getString("timezone");

      const client = new MongoClient(global.mongoConnectionString);
      const collection = client
        .db("IRIS")
        .collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
      if (timezone == null) {
        const result = await collection.findOne({ id: user.id });
        client.close();
        if (result == null) {
          await interaction.reply({
            content: "This user does not have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
        await interaction.reply({
          content:
            user.username +
            (user.username.endsWith("s") ? "'" : "'s") +
            " timezone is **" +
            result.approximatedTimezone +
            "**",
          ephemeral: true,
        });
        return;
      } else if (timezone == "null") {
        const result = await collection.findOneAndUpdate(
          { id: user.id },
          { $set: { approximatedTimezone: null, timezones: [] } }
        );
        client.close();
        if (result.value == null) {
          await interaction.reply({
            content: "This user does not have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
        await interaction.reply({
          content:
            user.username +
            (user.username.endsWith("s") ? "'" : "'s") +
            " timezone has been successfully cleared.",
          ephemeral: true,
        });
        return;
      } else {
        timezone =
          moment.tz.names()[
            moment.tz
              .names()
              .map((a) => a.toLowerCase())
              .indexOf(timezone.toLowerCase())
          ];
        if (!timezone) {
          client.close()
          await interaction.reply({
            content:
              "This timezone is invalid! Please use the format: Region/City. You can find all valid timezones here: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List",
            ephemeral: true,
          });
          return;
        }
        const result = await collection.findOneAndUpdate(
          { id: user.id },
          { $set: { approximatedTimezone: timezone, timezones: [timezone] } }
        );
        client.close();
        if (result.value == null) {
          await interaction.reply({
            content: "This user does not have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
        await interaction.reply({
          content:
            user.username +
            (user.username.endsWith("s") ? "'" : "'s") +
            " timezone has been successfully set to **" +
            timezone +
            "**.",
          ephemeral: true,
        });
        return;
      }
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
