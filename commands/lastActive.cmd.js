const Discord = require("discord.js");
const commandInfo = {
  help: "Check when a user was last active.", // This is the general description of the command.
  usage: "[COMMAND] <required> [optional]", // [COMMAND] gets replaced with the command and correct prefix later
  category: "fun/music/mod/misc/economy",
  reqPermissions: [],
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
    await interaction.deferReply();
    const target = interaction.options.getUser("user");
    const client = new MongoClient(global.mongoConnectionString);

    try {
      const database = client.db("IRIS");
      const userdata = database.collection(
        global.app.config.development ? "userdata_dev" : "userdata"
      );
      let a;
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

/**
 *
 * @param {Date} date
 * @param {*} prefomattedDate
 * @param {*} hideYear
 * @returns
 */
function getFormattedDate(date, prefomattedDate = false, hideYear = false) {
  const day = date.getUTCDate();
  const month = MONTH_NAMES[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  let hours = date.getUTCHours();
  let minutes = date.getUTCMinutes();
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
  const yesterday = new Date(today - DAY_IN_MS);
  const seconds = Math.round((today - date) / 1000);
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
module.exports = {
  runCommand,
  returnFileName,
  commandHelp,
  commandUsage,
  commandCategory,
  getSlashCommand,
  commandPermissions,
  getSlashCommandJSON,
};
