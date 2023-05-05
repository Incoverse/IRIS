const Discord = require("discord.js");
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("upcoming")
    .setDescription("Get the next 5 upcoming birthdays.")
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
    // make a function that sorts the global.birthdays array (which is made up out of objects) by how long is left until that birthday from today. if the birthday has already passed this year, change the year to the next year. The users timezone is in birthday.timezone, if its null, make it "Europe/London". This is an example of a birthday object:
    // {
    //     id: '247068471144349696',
    //     birthday: '2001-06-16',
    //     timezone: 'Europe/Berlin',
    //     passed: false
    // }
    // The "birthday" property can start with 0000- if the user didnt want to show their age
    // Please use the 'moment' variable which is the 'moment-timezone' library
    function upcoming() {
      const upcomingBirthdays = [];
      for (let i = 0; i < global.birthdays.length; i++) {
        let birthday = global.birthdays[i];
        let daysLeft = howManyDaysUntilBirthday(
          birthday.birthday,
          undefined,
          true
        );
        if (daysLeft >= 0) upcomingBirthdays.push(birthday);
      }
      upcomingBirthdays.sort((a, b) => {
        let aDaysLeft = howManyDaysUntilBirthday(a.birthday, undefined, true);
        let bDaysLeft = howManyDaysUntilBirthday(b.birthday, undefined, true);
        if (aDaysLeft < bDaysLeft) return -1;
        if (aDaysLeft > bDaysLeft) return 1;
        return 0;
        // return aDaysLeft - bDaysLeft < 0 ? -1 : 1;
      });
      return upcomingBirthdays;
    }
    let upcomingBirthdaysArray = upcoming();
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
      });
    for (let i = 0; i < 5; i++) {
      if (!upcomingBirthdaysArray[i]) break;
      let birthday = upcomingBirthdaysArray[i];

      // Fetch the user using client.users.fetch() and store it to a 'user' variable.
      // This will return a Promise, so we need to await it.
      const user = await interaction.guild.members.fetch(birthday.id);

      // How many days is it left until users birthday? (keep in mind to use the timezone property)
      let daysLeft = howManyDaysUntilBirthday(birthday.birthday);
      embed.addFields({
        name: `${user.user.tag} ${user.nickname ? `(${user.nickname})` : ""}`,
        value: `${DateFormatter.formatDate(
          new Date(birthday.birthday),
          `MMMM ????`
        ).replace(
          "????",
          getOrdinalNum(new Date(birthday.birthday).getDate())
        )} (*${daysLeft} day${daysLeft == 0 || daysLeft > 1 ? "s" : ""} left*)`,
      });
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
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

function howManyDaysUntilBirthday(
  birthday,
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

module.exports = {
  runCommand,
  returnFileName: () =>
    __filename.split(process.platform == "linux" ? "/" : "\\")[
      __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
    ],
  commandCategory: () => commandInfo.category,
  getSlashCommand: () => commandInfo.slashCommand,
};
