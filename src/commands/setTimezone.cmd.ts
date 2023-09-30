/*
 * Copyright (c) 2023 Inimi | InimicalPart | Incoverse
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Discord, { CommandInteractionOptionResolver } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
    slashCommand: new Discord.SlashCommandBuilder()
    .setName("settimezone")
    .setDescription("Set your timezone!")
    .addStringOption((option) =>
      option
        .setName("timezone")
        .setDescription(
          "Use https://webbrowsertools.com/timezone/ to find your timezone. (will be in the 'Timezone' field)"
        )
    )
    .setDMPermission(false),
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};
export const setup = async (client: Discord.Client, RM: object) => true;
export async function runCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  try {
    const client = new MongoClient(global.mongoConnectionString);
    try {
      const db = client.db(
        global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS"
      );
      const userdata = db.collection(
        global.app.config.development
          ? "DEVSRV_UD_" + global.app.config.mainServer
          : "userdata"
      );

      const commandOptions =
        interaction.options as CommandInteractionOptionResolver;

      if (!commandOptions.getString("timezone")) {
        await interaction.reply({
          embeds: [
            new Discord.EmbedBuilder()
              .setTitle("/settimezone")
              .setDescription(
                "You need to specify your timezone! Please use https://webbrowsertools.com/timezone/ to find your timezone. It will be in the 'Timezone' field. You can also specify 'none' to let IRIS automatically set your timezone."
              )
              .setColor(Discord.Colors.Red),
          ],
          ephemeral: true,
        });
        return;
      }

      //! Check if the timezone is valid
      if (
        moment.tz.names().map(a=>a.toLowerCase()).indexOf(commandOptions.getString("timezone").toLowerCase()) === -1 &&
        commandOptions.getString("timezone").toLowerCase() !== "none"
      ) {
        await interaction.reply({
          embeds: [
            new Discord.EmbedBuilder()
              .setTitle("/settimezone")
              .setDescription(
                "The timezone you specified is invalid! Please use https://webbrowsertools.com/timezone/ to find your timezone. It will be in the 'Timezone' field. You can also specify 'none' to let IRIS automatically set your timezone."
              )
              .setColor(Discord.Colors.Red),
          ],
          ephemeral: true,
        });
        return;
      }
      
      let dbclient = new MongoClient(global.mongoConnectionString);
      try {
        await dbclient.connect();
        const database = dbclient.db(
          global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS"
        );
        const userdata = database.collection(
          global.app.config.development
            ? "DEVSRV_UD_" + global.app.config.mainServer
            : "userdata"
        );
        if (commandOptions.getString("timezone").toLowerCase() === "none") {
          let user = await userdata.findOne({ id: interaction.user.id });
          await userdata.updateOne(
            { id: interaction.user.id },
            {
              $set: {
                approximatedTimezone:
                  user.timezones.length > 0 ? mode(user.timezones) : null,
                "settings.changeTimezone": true,
              },
            }
          );
          await interaction.reply({
            content:
              "Your timezone will now automatically get set by IRIS when you type `timezone <time for you>`.",
            ephemeral: true,
          });
        } else {
          let timezone = moment.tz.names()[moment.tz.names().map(a=>a.toLowerCase()).indexOf(commandOptions.getString("timezone").toLowerCase())]
          await userdata.updateOne(
            { id: interaction.user.id },
            {
              $set: {
                approximatedTimezone: timezone,
                "settings.changeTimezone": false,
              },
            }
          );
          await interaction.reply({
            content:
              "Your timezone has been set to `" +
              timezone +
              "`!",
            ephemeral: true,
          });
        }
      } finally {
        await dbclient.close();
      }
    } finally {
      await client.close();
    }
  } catch (e) {
    global.logger.error(e, returnFileName());
    await interaction.client.application.fetch();
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true
            ? "\n\n``" +
              (global.app.owners.includes(interaction.user.id)
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
              (global.app.owners.includes(interaction.user.id)
                ? e.stack.toString()
                : e.toString()) +
              "``"
            : ""),
        ephemeral: true,
      });
    }
  }
}
function mode(arr) {
  return arr
    .sort(
      (a, b) =>
        arr.filter((v) => v === a).length - arr.filter((v) => v === b).length
    )
    .pop();
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
      let fullHourOffset = Math.abs(offset);
      let minuteOffset = 60 * (Math.abs(offset) - fullHourOffset);
      stringOffset += fullHourOffset + ":" + minuteOffset;
    } else {
      stringOffset += Math.abs(offset);
    }
  }
  return "UTC" + stringOffset;
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const getSlashCommand = () => commandInfo.slashCommand;

export const commandSettings = () => commandInfo.settings;
