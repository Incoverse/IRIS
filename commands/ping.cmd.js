const { SlashCommandBuilder } = require("discord.js");
const commandInfo = {
  help: "eats your cake!", // This is the general description of the command.
  usage: "[COMMAND] <required> [optional]", // [COMMAND] gets replaced with the command and correct prefix later
  category: "fun/music/mod/misc/economy",
  reqPermissions: [],
  slashCommand: new global.SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pong! "),
};
const Discord = require("discord.js");

/**
 *
 * @param {Discord.CommandInteraction} interaction
 * @param {Object} RM
 */
async function runCommand(interaction, RM) {
  // cmd stuff here
  console.log(interaction);
  interaction.reply("Pong! " + interaction.client.ws.ping + "ms");
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
module.exports = {
  runCommand,
  commandHelp,
  commandUsage,
  commandCategory,
  getSlashCommand,
  commandPermissions,
  getSlashCommandJSON,
};
