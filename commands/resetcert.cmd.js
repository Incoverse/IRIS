const Discord = require("discord.js");
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("resetcert")
    .setDescription("Force a reset of the certificate for MongoDB.")
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
};
const { promisify } = require("util");
const moment = require("moment-timezone");
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
        /* prettier-ignore */
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+global.chalk.yellow(interaction.user.tag)+" replaced the MongoDB certificate.");
        interaction.deferReply();
        let beforeChange,
          output = null;
        try {
          beforeChange = await exec(
            "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
          );
          await exec("sudo /root/resetcert.sh 0");
          output = await exec(
            "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
          );
        } catch (e) {
          await exec("sudo /root/resetcert.sh 0");
          await sleep(1500);
          let fullchainexists = require("fs").existsSync(
            "/etc/ssl/IRIS/fullchain.pem"
          );
          let mongodpemexists = require("fs").existsSync(
            "/etc/ssl/IRIS/mongod.pem"
          );
          if (fullchainexists && mongodpemexists) {
            output = await exec(
              "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
            );
            interaction.editReply(
              "Something errored for a second, I have gotten back the files now, The certificate expires in: ``" +
                prettyms(
                  new Date(output.stdout.trim().split("=")[1]) - new Date()
                ) +
                "`` (``" +
                output.stdout.trim().split("=")[1] +
                "``)"
            );
            return;
          } else {
            interaction.editReply(
              "Some files are missing!!\n" +
                (fullchainexists
                  ? "fullchain.pem exists"
                  : "fullschain.pem missing!") +
                (fullchainexists && mongodpemexists ? "\n" : "") +
                (mongodpemexists ? "mongod.pem exists" : "mongod.pem missing!")
            );
            return;
          }
        }
        if (output.stdout == beforeChange.stdout) {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+"Certificate not changed, reason: No new certificate is available. This certificate expires in: " + global.chalk.yellow(output.stdout));
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
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+"Certificate successfully replaced. Expires in: " + global.chalk.yellow(output.stdout));
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
