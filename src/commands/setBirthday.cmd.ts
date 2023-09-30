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
import { MongoClient } from "mongodb";
import moment from "moment-timezone";
import chalk from "chalk";
declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
    slashCommand: new Discord.SlashCommandBuilder()
    .setName("setbirthday")
    .setDescription("Set your birthday.")
    .addStringOption((option) =>
      option
        .setName("date")
        .setDescription(
          "Type in your birthday in a YYYY-MM-DD format. (put ???? as year to hide your age)"
        )
        .setRequired(true)
    )
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
    let date: string = interaction.options.get("date").value.toString();
    const client = new MongoClient(global.mongoConnectionString);
    if (date == "none") {
      if (!global.birthdays.some((el) => el.id === interaction.user.id)) {
        client.close();
        await interaction.reply({
          content: "You don't have a birthday set!",
          ephemeral: true,
        });
        return;
      }
      await interaction.deferReply({
        ephemeral: true,
      });
      try {
        const database = client.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
        const userdata = database.collection(
          global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
        );
        let a;
        // Query for a movie that has the title 'Back to the Future'
        const query = { id: interaction.user.id };
        let userInfo = await userdata.findOne(query);
        userInfo.birthday = null;
        await userdata.replaceOne({ id: interaction.user.id }, userInfo);
      } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
      }
      global.birthdays = global.birthdays.filter(
        (obj) => obj.id !== interaction.user.id
      );
      return await interaction.editReply(
        "Your birthday has been cleared successfully."
      );
    }
    if (global.birthdays.some((el) => el.id === interaction.user.id)) {
      const openATicketChannel = (
        await interaction.guild.channels.fetch()
      ).find((channel) => channel.name.toLowerCase().includes("open-a-ticket"));
      await interaction.reply({
        content:
          "You already have set your birthday! Your birthday is set to: ``" +
          DateFormatter.formatDate(
            new Date(
              global.birthdays.find(
                (el) => el.id == interaction.user.id
              ).birthday
            ),
            global.birthdays
              .find((el) => el.id == interaction.user.id)
              .birthday.includes("0000")
              ? `MMMM ????`
              : `MMMM ????, YYYY`
          ).replace("????", getOrdinalNum(new Date(date).getDate())) +
          "``. If you have accidentally made a mistake when setting your birthday, please " +(openATicketChannel !== undefined  ? `<#${openATicketChannel.id}>.`
            : "contact a staff member."),
        ephemeral: true,
      });
      client.close();
      return;
    }

    let hasQuestionMarks = false;
    if (date.includes("????")) {
      hasQuestionMarks = true;
      date = date.replace("????", "0000");
    }
    if (date.includes("?")) {
      // user put ? in the months/days or as a separator
      await interaction.reply({
        content: "Invalid date! Please provide the date in a YYYY-MM-DD format",
        ephemeral: true,
      });
      client.close();
      return;
    }
    const match = date.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
    if (match) {
      date = match[0];
    } else {
      // yyyy-mm-dd format not found
      await interaction.reply({
        content: "Invalid date! Please provide the date in a YYYY-MM-DD format",
        ephemeral: true,
      });
      client.close();
      return;
    }
    if (new Date(date).toString() == "Invalid Date") {
      await interaction.reply({
        content: "Invalid date! Please provide the date in a YYYY-MM-DD format",
        ephemeral: true,
      });
      client.close();
      return;
    }
    if (
      new Date(date).getUTCFullYear() < new Date().getUTCFullYear() - 100 &&
      hasQuestionMarks == false
    ) {
      await interaction.reply({
        content: "Invalid date!",
        ephemeral: true,
      });
      client.close();
      return;
    }
    if (
      new Date().getUTCFullYear() - new Date(date).getUTCFullYear() < 13 &&
      hasQuestionMarks == false
    ) {
      await interaction.reply({
        content:
          "You're too young! You need to be at least 13 years old. **Keep in mind that Discord's ToS say that you have to be at least 13 to use their service.**",
        ephemeral: true,
      });
      client.close();
      return;
    }
    if (new Date() < new Date(date)) {
      // date is in the future
      await interaction.reply({
        content:
          "The date you have provided is in the future! Please provide your birthday (When you were born, not your upcoming birthday).",
        ephemeral: true,
      });
      client.close();
      return;
    }

    await interaction.deferReply();
    try {
      const database = client.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
      const userdata = database.collection(
        global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
      );
      // Query for a movie that has the title 'Back to the Future'
      const query = { id: interaction.user.id };
      const userInfo = await userdata.findOne(query);
      let copy = global.birthdays.filter(
        (obj) => obj.id !== interaction.user.id
      );
      copy.push({
        timezone: userInfo.approximatedTimezone,
        birthday: date,
        id: interaction.user.id,
      });
      global.birthdays = copy;
      await userdata.updateOne(query, {
        $set: {
          birthday: date,
        },
      });
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
    /* prettier-ignore */
    global.logger.debug(`${chalk.yellow(interaction.user.username)} set their birthday to: ${date}`,returnFileName());
    await interaction.editReply(
      "Your birthday is now set to ``" +
        DateFormatter.formatDate(
          new Date(date),
          hasQuestionMarks ? `MMMM ????` : `MMMM ????, YYYY`
        ).replace("????", getOrdinalNum(new Date(date).getDate())) +
        "``"
    );
    return;
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
function getOrdinalNum(n) { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
/* prettier-ignore */
const DateFormatter = { monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], formatDate: function (e, t) { var r = this; return t = r.getProperDigits(t, /d+/gi, e.getDate()), t = (t = r.getProperDigits(t, /M+/g, e.getMonth() + 1)).replace(/y+/gi, (function (t) { var r = t.length, g = e.getFullYear(); return 2 == r ? (g + "").slice(-2) : 4 == r ? g : t })), t = r.getProperDigits(t, /H+/g, e.getHours()), t = r.getProperDigits(t, /h+/g, r.getHours12(e.getHours())), t = r.getProperDigits(t, /m+/g, e.getMinutes()), t = (t = r.getProperDigits(t, /s+/gi, e.getSeconds())).replace(/a/gi, (function (t) { var g = r.getAmPm(e.getHours()); return "A" === t ? g.toUpperCase() : g })), t = r.getFullOr3Letters(t, /d+/gi, r.dayNames, e.getDay()), t = r.getFullOr3Letters(t, /M+/g, r.monthNames, e.getMonth()) }, getProperDigits: function (e, t, r) { return e.replace(t, (function (e) { var t = e.length; return 1 == t ? r : 2 == t ? ("0" + r).slice(-2) : e })) }, getHours12: function (e) { return (e + 24) % 12 || 12 }, getAmPm: function (e) { return e >= 12 ? "pm" : "am" }, getFullOr3Letters: function (e, t, r, g) { return e.replace(t, (function (e) { var t = e.length; return 3 == t ? r[g].substr(0, 3) : 4 == t ? r[g] : e })) } };

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const getSlashCommand = () => commandInfo.slashCommand;

export const commandSettings = () => commandInfo.settings;
