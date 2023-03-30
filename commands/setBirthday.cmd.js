const Discord = require("discord.js");
const commandInfo = {
  usage: "[COMMAND] <required> [optional]", // [COMMAND] gets replaced with the command and correct prefix later
  category: "fun/music/mod/misc/economy",
  reqPermissions: [],
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
};
const { MongoClient } = require("mongodb");
let moment = require("moment-timezone");

/**
 *
 * @param {Discord.CommandInteraction} interaction
 * @param {Object} RM
 */
async function runCommand(interaction, RM) {
  try {
    let date = interaction.options.get("date").value;
    const client = new MongoClient(global.mongoConnectionString);
    if (date == "none") {
      if (!global.birthdays.some((el) => el.id === interaction.user.id)) {
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
        const database = client.db("IRIS");
        const userdata = database.collection(
          global.app.config.development ? "userdata_dev" : "userdata"
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
      await interaction.reply({
        content:
          "You already have set your birthday! Your birthday is set to: ``" +
          DateFormatter.formatDate(
            new Date(
              global.birthdays.find((el) => el.id == interaction.user.id).date
            ),
            global.birthdays
              .find((el) => el.id == interaction.user.id)
              .date.includes("0000")
              ? `MMMM ????`
              : `MMMM ????, YYYY`
          ).replace("????", getOrdinalNum(new Date(date).getDate())) +
          "``",
        ephemeral: true,
      });
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
      return;
    }
    const match = date.match(/[0-9]{4}\W[0-9]{2}\W[0-9]{2}/);
    if (match) {
      date = match[0];
    } else {
      // yyyy-mm-dd format not found
      await interaction.reply({
        content: "Invalid date! Please provide the date in a YYYY-MM-DD format",
        ephemeral: true,
      });
      return;
    }
    if (new Date(date) == "Invalid Date") {
      await interaction.reply({
        content: "Invalid date! Please provide the date in a YYYY-MM-DD format",
        ephemeral: true,
      });
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
      return;
    }
    if (
      new Date().getUTCFullYear() - new Date(date).getUTCFullYear() < 13 &&
      hasQuestionMarks == false
    ) {
      await interaction.reply({
        content:
          "You're too young! You need to be at least 13 years old. **Keep in mind that Discord ToS says that you have to be at least 13 to use their service.**",
        ephemeral: true,
      });
      return;
    }
    if (new Date() < new Date(date)) {
      // date is in the future
      await interaction.reply({
        content:
          "The date you have provided is in the future! Please provide your birthday (When you were born, not your upcoming birthday).",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();
    try {
      const database = client.db("IRIS");
      const userdata = database.collection(
        global.app.config.development ? "userdata_dev" : "userdata"
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
      await userdata.updateOne(
        query,
        {
          $set: {
            birthday: date,
          },
        },
        {}
      );
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
    /* prettier-ignore */
    global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+global.chalk.yellow(interaction.user.tag)+" set their birthday to: " + date);
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
                  interaction.client.application.owner.members.keys()
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
                  interaction.client.application.owner.members.keys()
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
/* prettier-ignore */
function getOrdinalNum(n) { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
/* prettier-ignore */
const DateFormatter = { monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], formatDate: function (e, t) { var r = this; return t = r.getProperDigits(t, /d+/gi, e.getDate()), t = (t = r.getProperDigits(t, /M+/g, e.getMonth() + 1)).replace(/y+/gi, (function (t) { var r = t.length, g = e.getFullYear(); return 2 == r ? (g + "").slice(-2) : 4 == r ? g : t })), t = r.getProperDigits(t, /H+/g, e.getHours()), t = r.getProperDigits(t, /h+/g, r.getHours12(e.getHours())), t = r.getProperDigits(t, /m+/g, e.getMinutes()), t = (t = r.getProperDigits(t, /s+/gi, e.getSeconds())).replace(/a/gi, (function (t) { var g = r.getAmPm(e.getHours()); return "A" === t ? g.toUpperCase() : g })), t = r.getFullOr3Letters(t, /d+/gi, r.dayNames, e.getDay()), t = r.getFullOr3Letters(t, /M+/g, r.monthNames, e.getMonth()) }, getProperDigits: function (e, t, r) { return e.replace(t, (function (e) { var t = e.length; return 1 == t ? r : 2 == t ? ("0" + r).slice(-2) : e })) }, getHours12: function (e) { return (e + 24) % 12 || 12 }, getAmPm: function (e) { return e >= 12 ? "pm" : "am" }, getFullOr3Letters: function (e, t, r, g) { return e.replace(t, (function (e) { var t = e.length; return 3 == t ? r[g].substr(0, 3) : 4 == t ? r[g] : e })) } };

function commandHelp() {
  return commandInfo.help;
}
function commandUsage() {
  return commandInfo.usage;
}
function commandCategory() {
  return commandInfo.category;
}
function getSlashCommand() {
  return commandInfo.slashCommand;
}
function commandPermissions() {
  return commandInfo.reqPermissions || null;
}
function getSlashCommandJSON() {
  if (commandInfo.slashCommand.length !== null)
    return commandInfo.slashCommand.toJSON();
  else return null;
}
function returnFileName() {
  return __filename.split("/")[__filename.split("/").length - 1];
}
function getHelp() {
  return commandInfo.detailedHelp;
}

module.exports = {
  runCommand,
  getHelp,
  returnFileName,
  commandHelp,
  commandUsage,
  commandCategory,
  getSlashCommand,
  commandPermissions,
  getSlashCommandJSON,
};
