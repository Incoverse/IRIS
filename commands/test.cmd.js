const { SlashCommandBuilder } = require("discord.js");
const commandInfo = {
  help: "eats your cake!", // This is the general description of the command.
  usage: "[COMMAND] <required> [optional]", // [COMMAND] gets replaced with the command and correct prefix later
  category: "fun/music/mod/misc/economy",
  reqPermissions: [],
  slashCommand: new SlashCommandBuilder()
    .setName("test")
    .setDescription("A quick command to help test variables and functions.")
    .addStringOption((option) =>
      option.setName("query").setDescription("lol").setRequired(true)
    ),
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
  // interaction.reply("IRIS version is: " + global.app.version);
  interaction.reply(
    "Initializing MongoDB connection and querying for: ``" +
      interaction.options.get("query").value +
      "``"
  );
  const { MongoClient } = require("mongodb");

  const client = new MongoClient(global.mongoConnectionString);
  try {
    const database = client.db("IRIS");
    const movies = database.collection("main");
    // Query for a movie that has the title 'Back to the Future'
    const query = JSON.parse(interaction.options.get("query").value);
    const movie = await movies.findOne(query);
    console.log(movie);
    interaction.followUp(
      "```json\n" + JSON.stringify(movie, null, 2) + "\n```"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
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
