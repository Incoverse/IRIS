/*
  * Copyright (c) 2023 Inimi | InimicalPart | InCo
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

import Discord, { Team } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("lastactive")
    .setDescription("Check when a user was last active.")
    .addUserOption((option) =>
    option
    .setName("user")
    .setDescription("The user you want to check")
        .setRequired(true)
        )
        .setDMPermission(false),
        // .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
        settings: {
          devOnly: false
        },
};

export async function runCommand(interaction: Discord.CommandInteraction, RM: object) {
  try {
    await interaction.deferReply();
    const target = interaction.options.getUser("user");
    const client = new MongoClient(global.mongoConnectionString);

    try {
      const database = client.db("IRIS");
      const userdata = database.collection(
        global.app.config.development ? "userdata_dev" : "userdata"
      );
      // Query for a movie that has the title 'Back to the Future'
      const query = { id: target.id };
      let userInfo = await userdata.findOne(query);
      if (userInfo == null || userInfo.last_active == null) {
        await interaction.editReply(
          "This user has never interacted with this server."
        );
      } else {
        await interaction.editReply({
          content:
            "<@" +
            target.id +
            "> was last active ``" +
            timeAgo(new Date(userInfo.last_active)) +
            "``",
          allowedMentions: { parse: [] },
        });
      }
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
    return;
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
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getFormattedDate(date: Date, prefomattedDate: any = false, hideYear: any = false) {
  const day = date.getUTCDate();
  const month = MONTH_NAMES[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  let hours = date.getUTCHours();
  let minutes:any = date.getUTCMinutes();
  const ampm = true;
  if (minutes < 10) {
    // Adding leading zero to minutes
    minutes = `0${minutes}`;
  }
  let AMPM = "";
  if (ampm) {
    if (hours > 12) {
      AMPM = "pm";
      hours -= 12;
    } else {
      AMPM = "am";
    }
  }

  if (prefomattedDate) {
    // Today at 10:20
    // Yesterday at 10:20
    return `${prefomattedDate} at ${hours}:${minutes}${AMPM} UTC`;
  }

  if (hideYear) {
    // 10. January at 10:20
    return `${day}. ${month} at ${hours}:${minutes}${AMPM} UTC`;
  }

  // 10. January 2017. at 10:20
  return `${day}. ${month} ${year}. at ${hours}:${minutes}${AMPM} UTC`;
}

// --- Main function
function timeAgo(dateParam) {
  if (!dateParam) {
    return null;
  }

  const date = typeof dateParam === "object" ? dateParam : new Date(dateParam);
  const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
  const today = new Date();
  const yesterday = new Date(today.getTime() - DAY_IN_MS);
  const seconds = Math.round((today.getTime() - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();
  const isYesterday = yesterday.toDateString() === date.toDateString();
  const isThisYear = today.getUTCFullYear() === date.getUTCFullYear();

  if (seconds < 5) {
    return "just now";
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (seconds < 90) {
    return "about a minute ago";
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (isToday) {
    return getFormattedDate(date, "Today"); // Today at 10:20
  } else if (isYesterday) {
    return getFormattedDate(date, "Yesterday"); // Yesterday at 10:20
  } else if (isThisYear) {
    return getFormattedDate(date, false, true); // 10. January at 10:20
  }

  return getFormattedDate(date); // 10. January 2017. at 10:20
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const getSlashCommand = () => commandInfo.slashCommand;
export const commandCategory = () => commandInfo.category;
export const commandSettings = () => commandInfo.settings;