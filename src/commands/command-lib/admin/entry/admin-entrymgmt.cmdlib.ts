/*
  * Copyright (c) 2024 Inimi | InimicalPart | Incoverse
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

import Discord, { CommandInteractionOptionResolver, Team } from "discord.js";
import { IRISGlobal } from "../../../../interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import {exec} from "child_process";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
    const subcommand = (
        interaction.options as CommandInteractionOptionResolver
      ).getSubcommand(true);
    if (subcommand == "get") {
        const user = (
          interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);
    
        if (user.bot) {
          await interaction.reply({
            content:
              "This user is a bot and cannot have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
        const client = new MongoClient(global.mongoConnectionString);
    
        const collection = client
          .db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS")
          .collection(
            global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
          );
        const result = await collection.findOne({ id: user.id });
        client.close();
        if (result == null) {
          await interaction.reply({
            content: "This user does not have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
        delete result._id;
        await interaction.reply({
          content: "```json\n" + JSON.stringify(result, null, 2) + "```",
          ephemeral: true,
          allowedMentions: { parse: [] },
        });
      } else if (subcommand == "create") {
        const user = (
          interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);
        const birthday = (
          interaction.options as CommandInteractionOptionResolver
        ).getString("birthday");
        let timezone = (
          interaction.options as CommandInteractionOptionResolver
        ).getString("timezone");
    
        if (user.bot) {
          await interaction.reply({
            content:
              "This user is a bot and cannot have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
    
        const client = new MongoClient(global.mongoConnectionString);
    
        const collection = client
          .db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS")
          .collection(
            global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
          );
    
        // Check if the user already has an entry in the database
        const result = await collection.findOne({ id: user.id });
        if (result != null) {
          client.close()
          await interaction.reply({
            content: "This user already has an entry in the database!",
            ephemeral: true,
          });
          return;
        }
    
        const entry = {
          ...global.app.config.defaultEntry,
          ...{
            id: user.id,
            username: user.username,
          },
        };
        if (user.discriminator !== "0" && user.discriminator)
          entry.discriminator = user.discriminator;
        if (birthday != null) {
          entry.birthday = birthday;
        }
        if (timezone != null) {
          timezone =
            moment.tz.names()[
              moment.tz
                .names()
                .map((a) => a.toLowerCase())
                .indexOf(timezone.toLowerCase())
            ];
          if (!timezone) {
            await interaction.reply({
              content:
                "This timezone is invalid! Please use the format: Region/City. You can find all valid timezones here: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List",
              ephemeral: true,
            });
            return;
          }
          entry.approximatedTimezone = timezone;
          entry.timezones.push(timezone);
        }
    
        await collection.insertOne(entry);
        client.close();
        delete entry._id;
        await interaction.reply({
          content:
            "Entry successfully created for **" +
            user.username +
            ":**" +
            "```json\n" +
            JSON.stringify(entry, null, 2) +
            "```",
          ephemeral: true,
          allowedMentions: { parse: [] },
        });
      } else if (subcommand == "delete") {
        const user = (
          interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);
        const client = new MongoClient(global.mongoConnectionString);
    
        const collection = client
          .db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS")
          .collection(
            global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
          );
        /*
         * Here we do not check if the user is a bot, because if a bot entry is accidentally created, it should be able to be deleted.
         */
        const result = await collection.findOneAndDelete({ id: user.id });
        await interaction.reply({
          content:
            result.value != null
              ? "**" +
                user.username +
                (user.username.endsWith("s") ? "'" : "'s") +
                "** entry has been successfully deleted."
              : "This user does not have an entry in the database!",
          ephemeral: true,
        });
        client.close();
      }
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];



