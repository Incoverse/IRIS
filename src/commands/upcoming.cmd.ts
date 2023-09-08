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

import Discord from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import moment, { updateLocale } from "moment-timezone";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("upcoming")
    .setDescription("Get the next 5 upcoming birthdays.")
    .setDMPermission(false),
  // .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

export const setup = async (client:Discord.Client, RM: object) => true
export async function runCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  try {
    const getBirthdays = (birthdays: any[]) => {
      const now = moment.tz();
      const next5Birthdays = birthdays
        .filter(a=>!a.passed)
        .map((birthday: { birthday: string; timezone: string; id: string }) => {
          const birthdayMoment = moment(birthday.birthday).tz(
            birthday.timezone ?? "Europe/Berlin"
          );
          const nextBirthday = birthdayMoment.year(now.year());
          if (nextBirthday.isBefore(now)) {
            nextBirthday.add(1, "year");
          }
          return {
            ...birthday,
            nextBirthday,
          };
        })
        .sort(
          (
            a: { nextBirthday: { diff: (arg0: any) => any } },
            b: { nextBirthday: any }
          ) => a.nextBirthday.diff(b.nextBirthday)
        );
      return next5Birthdays
        .slice(0, 5)
        .map(({ nextBirthday, ...rest }) => rest);
    };

    let upcomingBirthdaysArray = getBirthdays(global.birthdays);
    if (upcomingBirthdaysArray.length == 0) {
      await interaction.reply({
        content: "*No upcoming birthdays.*",
        ephemeral: true,
      });
      return;
    }

    //Send the result in an embed, with each birthday being a field
    const embed = new Discord.EmbedBuilder()
      .setTitle("Upcoming birthdays")
      .setColor("Default")
      .setFooter({
        text: "Days are calculated using the timezone that IRIS' server is in.",
        iconURL: "https://i.imgur.com/QRoFlvu.png",
      });
    for (let birthday of upcomingBirthdaysArray) {
      // Fetch the user using client.users.fetch() and store it to a 'user' variable.
      // This will return a Promise, so we need to await it.
      const user = await interaction.guild.members.fetch(birthday.id);

      // How many days is it left until users birthday? (keep in mind to use the timezone property)
      let daysLeft = howManyDaysUntilBirthday(birthday.birthday);
      embed.addFields({
        name: user.displayName + " (" + user.user.username + ")",
        value: (turnsAge(birthday.birthday) == null ? "Turns another year on **" : ("Turns **" + turnsAge(birthday.birthday) + " years old** on **")) + `${DateFormatter.formatDate(
          new Date(birthday.birthday),
          `MMMM ????`
        ).replace(
          "????",
          getOrdinalNum(new Date(birthday.birthday).getDate())
        )}** (*${daysLeft} day${daysLeft == 0 || daysLeft > 1 ? "s" : ""} left*)`,
      });
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
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
/* prettier-ignore */
function getOrdinalNum(n: number) { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
/* prettier-ignore */
const DateFormatter = {monthNames: ["January","February","March","April","May","June","July","August","September","October","November","December",],dayNames: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday",],formatDate: function (e: {getDate: () => any;getMonth: () => number;getFullYear: () => any;getHours: () => any;getMinutes: () => any;getSeconds: () => any;getDay: () => any;}, t: any) {var r = this;t = r.getProperDigits(t, /d+/gi, e.getDate());t = r.getProperDigits(t, /M+/g, e.getMonth() + 1);t = t.replace(/y+/gi, function (match: string) {var r = match.length,g = e.getFullYear();return 2 == r ? (g + "").slice(-2) : 4 == r ? g : match;});t = r.getProperDigits(t, /H+/g, e.getHours());t = r.getProperDigits(t, /h+/g, r.getHours12(e.getHours()));t = r.getProperDigits(t, /m+/g, e.getMinutes());t = t.replace(/s+/gi, function (match: string) {return r.getProperDigits(match, /s+/gi, e.getSeconds());});t = t.replace(/a/gi, function (match: string) {var g = r.getAmPm(e.getHours());return "A" === match ? g.toUpperCase() : g;});t = r.getFullOr3Letters(t, /d+/gi, r.dayNames, e.getDay());t = r.getFullOr3Letters(t, /M+/g, r.monthNames, e.getMonth());return t;},getProperDigits: function (e: string, t: any, r: string) {return e.replace(t, function (match: string) {var t = match.length;return 1 == t ? r : 2 == t ? ("0" + r).slice(-2) : match;});},getHours12: function (e: number) {return ((e + 24) % 12) || 12;},getAmPm: function (e: number) {return e >= 12 ? "pm" : "am";},getFullOr3Letters: function (e: string, t: any, r: { [x: string]: any }, g: string | number) {return e.replace(t, function (match: string) {var t = match.length;return 3 == t ? r[g].substr(0, 3) : 4 == t ? r[g] : match;})}};

function turnsAge(birthday) {
  const currentYear = new Date().getFullYear();
  const birthdayYear = new Date(birthday).getFullYear();
  if (birthdayYear == 0) return null;
  return currentYear - birthdayYear;
}

function howManyDaysUntilBirthday(
  birthday: any,
  timezone = moment.tz.guess(),
  precise = false
) {
  return precise
    ? (moment
        .tz(timezone)
        .diff(moment.tz(birthday, timezone).year(moment.tz(timezone).year())) /
        (24 * 60 * 60 * 1000)) *
        -1
    : Math.floor(
        moment
          .tz(timezone)
          .diff(
            moment.tz(birthday, timezone).year(moment.tz(timezone).year())
          ) /
          (24 * 60 * 60 * 1000)
      ) * -1;
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const getSlashCommand = () => commandInfo.slashCommand;
export const commandCategory = () => commandInfo.category;
export const commandSettings = () => commandInfo.settings;
