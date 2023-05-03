const { SlashCommandBuilder } = require("discord.js");
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new SlashCommandBuilder()
    .setName("version")
    .setDescription("Check which version IRIS is running."),
};
const Discord = require("discord.js");
let moment = require("moment-timezone");
const { MongoClient } = require("mongodb");
/**
 *
 * @param {Discord.CommandInteraction} interaction
 * @param {Object} RM
 */
async function runCommand(interaction, RM) {
  try {
    interaction.reply({
      content:
        "IRIS is currently running ``v" +
        require(require("path").join(global.dirName, "package.json")).version +
        "``",
      ephemeral: true,
    });
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
module.exports = {
  runCommand,
  returnFileName: () =>
    __filename.split(process.platform == "linux" ? "/" : "\\")[
      __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
    ],
  commandCategory: () => commandInfo.category,
  getSlashCommand: () => commandInfo.slashCommand,
};
