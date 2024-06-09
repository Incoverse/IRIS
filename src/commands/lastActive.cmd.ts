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

import * as Discord from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import storage from "@src/lib/utilities/storage.js";
import { IRISCommand, IRISSlashCommand } from "@src/lib/base/IRISCommand.js";

declare const global: IRISGlobal;

export default class LastActive extends IRISCommand {
  protected _slashCommand: IRISSlashCommand = new Discord.SlashCommandBuilder()
    .setName("lastactive")
    .setDescription("Check when a user was last active.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to check")
        .setRequired(true)
    )
    
    public async runCommand(interaction: Discord.CommandInteraction) {
        await interaction.deferReply();
        const target = (interaction.options as Discord.CommandInteractionOptionResolver).getUser("user");
        try {
          let userInfo = await storage.findOne("user", { id: target.id });
          if (userInfo == null || userInfo.last_active == null) {
            await interaction.editReply(
              "This user has never interacted with this server."
            );
          } else {
            await interaction.editReply({
              content:
                "<@" + target.id + "> was last active ``" +
                timeAgo(new Date(userInfo.last_active)) +
                "``",
              allowedMentions: { parse: [] },
            });
          }
        } catch (e) {
          global.logger.error(e.toString(), this.fileName);
        } 
        return;
    }
};


const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getFormattedDate(
  date: Date,
  prefomattedDate: any = false,
  hideYear: any = false
) {
  const day = getOrdinalNum(date.getUTCDate());
  const month = MONTH_NAMES[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  let hours = date.getUTCHours();
  let minutes: any = date.getUTCMinutes();
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
    return `${prefomattedDate} at ${hours.toString().padStart(2,"0")}:${minutes.toString().padStart(2,"0")}${AMPM} UTC`;
  }

  if (hideYear) {
    // 10. January at 10:20
    return `${month} ${day}, at ${hours.toString().padStart(2,"0")}:${minutes.toString().padStart(2,"0")}${AMPM} UTC`;
  }

  // 10. January 2017. at 10:20
  return `${month} ${day}, ${year} at ${hours.toString().padStart(2,"0")}:${minutes.toString().padStart(2,"0")}${AMPM} UTC`;
}

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
/* prettier-ignore */
function getOrdinalNum(n:number) { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
