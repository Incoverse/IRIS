const Discord = require("discord.js");
const commandInfo = {
  usage: "[COMMAND] <required> [optional]", // [COMMAND] gets replaced with the command and correct prefix later
  category: "fun/music/mod/misc/economy",
  reqPermissions: [],
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("help")
    .setDescription("See the descriptions of all commands that IRIS has.")
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
  interaction.reply({
    embeds: [
      new Discord.EmbedBuilder()
        .setColor("#e10000")
        .setTitle("IRIS' Command Help")
        .setDescription("This is a first demo of the help command")
        .addFields({
          name: "command1",
          value: "command1 help",
          inline: true,
        })
        .addFields({
          name: "command2",
          value: "command2 help",
          inline: true,
        }),
    ],
  });
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
