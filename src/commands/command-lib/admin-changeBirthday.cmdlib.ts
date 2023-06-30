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

import Discord, { CommandInteractionOptionResolver, Team } from "discord.js";
import { IRISGlobal } from "../../interfaces/global.js";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
    const user = (
        interaction.options as CommandInteractionOptionResolver
      ).getUser("user", true);
      let birthday = (
        interaction.options as CommandInteractionOptionResolver
      ).getString("birthday");

      if (birthday == "null") {
        const client = new MongoClient(global.mongoConnectionString);
        const collection = client
          .db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS")
          .collection(
            global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
          );
        const rresult = await collection.findOneAndUpdate(
          { id: user.id },
          { $set: { birthday: null } }
        );
        client.close();
        if (rresult.value == null) {
          await interaction.reply({
            content: "This user does not have an entry in the database!",
            ephemeral: true,
          });
          return;
        } else {
          await interaction.reply({
            content:
              user.username +
              (user.username.endsWith("s") ? "'" : "'s") +
              " birthday has been successfully cleared.",
            ephemeral: true,
          });
          return;
        }
      }
      let hasQuestionMarks = false;

      if (birthday.includes("????")) {
        hasQuestionMarks = true;
        birthday = birthday.replace("????", "0000");
      }
      if (birthday.includes("?")) {
        // user put ? in the months/days or as a separator
        await interaction.reply({
          content:
            "Invalid date! Please provide the date in a YYYY-MM-DD format",
          ephemeral: true,
        });
        return;
      }
      const match = birthday.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
      if (match) {
        birthday = match[0];
      } else {
        // yyyy-mm-dd format not found
        await interaction.reply({
          content:
            "Invalid date! Please provide the date in a YYYY-MM-DD format",
          ephemeral: true,
        });
        return;
      }
      if (new Date(birthday).toString() == "Invalid Date") {
        await interaction.reply({
          content:
            "Invalid date! Please provide the date in a YYYY-MM-DD format",
          ephemeral: true,
        });
        return;
      }
      if (
        new Date(birthday).getUTCFullYear() <
          new Date().getUTCFullYear() - 100 &&
        hasQuestionMarks == false
      ) {
        await interaction.reply({
          content: "Invalid date!",
          ephemeral: true,
        });
        return;
      }
      if (new Date() < new Date(birthday)) {
        // date is in the future
        await interaction.reply({
          content: "The date you have provided is in the future!",
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

      const result = await collection.findOneAndUpdate(
        { id: user.id },
        { $set: { birthday: birthday } }
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
          " birthday has been successfully set to **" +
          DateFormatter.formatDate(
            new Date(birthday),
            hasQuestionMarks ? `MMMM ????` : `MMMM ????, YYYY`
          ).replace("????", getOrdinalNum(new Date(birthday).getDate())) +
          "**.",
        ephemeral: true,
      });
}

/* prettier-ignore */
function getOrdinalNum(n) { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
/* prettier-ignore */
const DateFormatter = { monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], formatDate: function (e, t) { var r = this; return t = r.getProperDigits(t, /d+/gi, e.getDate()), t = (t = r.getProperDigits(t, /M+/g, e.getMonth() + 1)).replace(/y+/gi, (function (t) { var r = t.length, g = e.getFullYear(); return 2 == r ? (g + "").slice(-2) : 4 == r ? g : t })), t = r.getProperDigits(t, /H+/g, e.getHours()), t = r.getProperDigits(t, /h+/g, r.getHours12(e.getHours())), t = r.getProperDigits(t, /m+/g, e.getMinutes()), t = (t = r.getProperDigits(t, /s+/gi, e.getSeconds())).replace(/a/gi, (function (t) { var g = r.getAmPm(e.getHours()); return "A" === t ? g.toUpperCase() : g })), t = r.getFullOr3Letters(t, /d+/gi, r.dayNames, e.getDay()), t = r.getFullOr3Letters(t, /M+/g, r.monthNames, e.getMonth()) }, getProperDigits: function (e, t, r) { return e.replace(t, (function (e) { var t = e.length; return 1 == t ? r : 2 == t ? ("0" + r).slice(-2) : e })) }, getHours12: function (e) { return (e + 24) % 12 || 12 }, getAmPm: function (e) { return e >= 12 ? "pm" : "am" }, getFullOr3Letters: function (e, t, r, g) { return e.replace(t, (function (e) { var t = e.length; return 3 == t ? r[g].substr(0, 3) : 4 == t ? r[g] : e })) } };

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
