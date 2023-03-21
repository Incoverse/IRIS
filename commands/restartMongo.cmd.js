const Discord = require("discord.js");
const commandInfo = {
  help: "Force a restart of MongoDB.", // This is the general description of the command.
  usage: "[COMMAND] <required> [optional]", // [COMMAND] gets replaced with the command and correct prefix later
  category: "fun/music/mod/misc/economy",
  reqPermissions: [],
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("restartmongo")
    .setDescription("Force a restart of MongoDB.")
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
};
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
/**
 *
 * @param {Discord.CommandInteraction} interaction
 * @param {Object} RM
 */
async function runCommand(interaction, RM) {
  try {
    await interaction.client.application.fetch();
    if (
      [
        ...Array.from(interaction.client.application.owner.members.keys()),
        ...global.app.config.externalOwners,
      ].includes(interaction.user.id)
    ) {
      if (process.platform !== "linux") {
        return interaction.reply(
          "This command is disabled as this instance of IRIS is running on a " +
            process.platform.toUpperCase() +
            " system when we're expecting LINUX."
        );
      } else {
        interaction.deferReply();
        await exec("sudo systemctl restart mongod");
        await delay(1500);
        try {
          await exec("sudo systemctl status mongod | grep 'active (running)' ");
        } catch (e) {
          interaction.editReply(
            "⚠️ MongoDB has been restarted, but is not running due to a failure."
          );
          return;
        }
        interaction.editReply(
          ":white_check_mark: MongoDB has been restarted successfully."
        );
      }
    } else {
      interaction.reply({
        content: "You do not have permission to run this command.",
        ephemeral: true,
      });
    }
    return;
  } catch (e) {
    console.error(e);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true ? "\n\n" + e.toString() : ""),
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true ? "\n\n" + e.toString() : ""),
        ephemeral: true,
      });
    }
  }
}
const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};
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
