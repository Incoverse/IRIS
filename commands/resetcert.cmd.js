const Discord = require("discord.js");
const commandInfo = {
  help: "Force a reset of the certificate for MongoDB!", // This is the general description of the command.
  usage: "[COMMAND] <required> [optional]", // [COMMAND] gets replaced with the command and correct prefix later
  category: "fun/music/mod/misc/economy",
  reqPermissions: [],
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("resetcert")
    .setDescription("Force a reset of the certificate for MongoDB.")
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
    const prettyms = (await import("pretty-ms")).default;
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
        const beforeChange = await exec(
          "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
        );
        await exec("sudo /root/resetcert.sh 0");
        const output = await exec(
          "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
        );
        if (output.stdout == beforeChange.stdout) {
          interaction.editReply(
            "No new certificate is available. This certificate expires in: ``" +
              prettyms(
                new Date(output.stdout.trim().split("=")[1]) - new Date()
              ) +
              "`` (``" +
              output.stdout.trim().split("=")[1] +
              "``)"
          );
        } else {
          interaction.editReply(
            "The certificate has been successfully replaced. This certificate expires in: ``" +
              prettyms(
                new Date(output.stdout.trim().split("=")[1]) - new Date()
              ) +
              "`` (``" +
              output.stdout.trim().split("=")[1] +
              "``)"
          );
        }
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
