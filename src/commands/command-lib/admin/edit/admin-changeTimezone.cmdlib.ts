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
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import moment from "moment-timezone";
import storage from "@src/lib/utilities/storage.js";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(interaction: Discord.CommandInteraction) {
    const user = (
        interaction.options as CommandInteractionOptionResolver
      ).getUser("user", true);
      let timezone = (
        interaction.options as CommandInteractionOptionResolver
      ).getString("timezone");

      if (timezone == null) {
        const result = await storage.findOne("user", { id: user.id });
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
        await storage.updateOne(
          "user",
          { id: user.id },
          { $set: { approximatedTimezone: null, timezones: [] } }
        );
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
          await interaction.reply({
            content:
              "This timezone is invalid! Please use the format: Region/City. You can find all valid timezones here: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List",
            ephemeral: true,
          });
          return;
        }
        await storage.updateOne(
          "user",
          { id: user.id },
          { $set: { approximatedTimezone: timezone, timezones: [timezone] } }
        );
        let usersBirthday = global.birthdays.find((bd) => bd.id === user.id);
        if (usersBirthday) {
          const dSB = howManyDaysSinceBirthday(
            usersBirthday.birthday,
            timezone,
          );
          usersBirthday.timezone = timezone;
          usersBirthday.passed = dSB >= 0 && dSB < 2; 
          let birthdaysCopy = global.birthdays.filter((obj) => obj.id !== user.id);
          birthdaysCopy.push(usersBirthday);
          global.birthdays = birthdaysCopy;
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
function howManyDaysSinceBirthday(birthday: string, timezone: string) {
  return Math.floor(
    moment
      .tz(timezone)
      .diff(moment.tz(birthday, timezone).year(moment.tz(timezone).year())) /
      (24 * 60 * 60 * 1000)
  );
}