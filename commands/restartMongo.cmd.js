const Discord = require("discord.js");
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("restartmongo")
    .setDescription("Force a restart of MongoDB.")
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
};
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const moment = require("moment-timezone");

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
        /* prettier-ignore */
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+global.chalk.yellow(interaction.user.tag)+" has restarted MongoDB.");

        interaction.deferReply();
        await exec("sudo systemctl restart mongod");
        await delay(1500);
        try {
          await exec("sudo systemctl status mongod | grep 'active (running)' ");
        } catch (e) {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+global.chalk.red("MongoDB failed to start!"));
          interaction.editReply(
            "⚠️ MongoDB has been restarted, but is not running due to a failure."
          );
          return;
        }
        /* prettier-ignore */
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+global.chalk.greenBright("MongoDB successfully started back up!"));
        interaction.editReply(
          ":white_check_mark: MongoDB has been restarted successfully."
        );
      }
    } else {
      /* prettier-ignore */
      global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+global.chalk.yellow(interaction.user.tag)+" failed permission check.");

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
const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

module.exports = {
  runCommand,
  returnFileName: () => __filename.split("/")[__filename.split("/").length - 1],
  commandCategory: () => commandInfo.category,
  getSlashCommand: () => commandInfo.slashCommand,
};
