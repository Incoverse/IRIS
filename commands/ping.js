const { SlashCommandBuilder } = require('discord.js');
const commandInfo = {
    primaryName: "<command name>", // This is the command name used by help.js (gets uppercased).
    help: "eats your cake!", // This is the general description of the command.
    usage: "[COMMAND] <required> [optional]", // [COMMAND] gets replaced with the command and correct prefix later
    category: "fun/music/mod/misc/economy",
    reqPermissions: [],
    slashCommand: new global.SlashCommandBuilder()
    .setName("echo")
    .setDescription("Replies with your input!")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The input to echo back")
        .setRequired(true)
    ),
  };
  
  async function runCommand(message, args, RM) {
  
    // cmd stuff here
  }
  
  function commandPrim() {
    return commandInfo.primaryName;
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
    commandPrim,
    commandUsage,
    commandCategory,
    getSlashCommand,
    commandPermissions,
    getSlashCommandJSON,
  };