import Discord, { Team } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import {existsSync} from "fs";
import { promisify } from "util";
import {exec} from "child_process";
import moment from "moment-timezone";
import prettyMilliseconds from "pretty-ms";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("resetcert")
    .setDescription("Force a reset of the certificate for MongoDB.")
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
};
const execPromise = promisify(exec);
export async function runCommand(interaction: Discord.CommandInteraction, RM: object) {

  try {
    await interaction.client.application.fetch();
    if (
      [
        ...Array.from(                (interaction.client.application.owner as Team).members.keys()),
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
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.yellow(interaction.user.tag)+" replaced the MongoDB certificate.");
        interaction.deferReply();
        let beforeChange,
          output = null;
        try {
          beforeChange = await execPromise(
            "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
          );
          await execPromise("sudo /root/resetcert.sh 0");
          output = await execPromise(
            "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
          );
        } catch (e) {
          await execPromise("sudo /root/resetcert.sh 0");
          await sleep(1500);
          let fullchainexists = existsSync(
            "/etc/ssl/IRIS/fullchain.pem"
          );
          let mongodpemexists = existsSync(
            "/etc/ssl/IRIS/mongod.pem"
          );
          if (fullchainexists && mongodpemexists) {
            output = await execPromise(
              "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
            );
            interaction.editReply(
              "Something errored for a second, I have gotten back the files now, The certificate expires in: ``" +
                prettyMilliseconds(
                  new Date(output.stdout.trim().split("=")[1]).getTime() - new Date().getTime()
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
                  : "fullchain.pem missing!") +
                (fullchainexists && mongodpemexists ? "\n" : "") +
                (mongodpemexists ? "mongod.pem exists" : "mongod.pem missing!")
            );
            return;
          }
        }
        if (output.stdout == beforeChange.stdout) {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+"Certificate not changed, reason: No new certificate is available. This certificate expires in: " + chalk.yellow(output.stdout));
          interaction.editReply(
            "No new certificate is available. This certificate expires in: ``" +
              prettyMilliseconds(
                new Date(output.stdout.trim().split("=")[1]).getTime() - new Date().getTime()
              ) +
              "`` (``" +
              output.stdout.trim().split("=")[1] +
              "``)"
          );
        } else {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+"Certificate successfully replaced. Expires in: " + chalk.yellow(output.stdout));
          interaction.editReply(
            "The certificate has been successfully replaced. This certificate expires in: ``" +
              prettyMilliseconds(
                new Date(output.stdout.trim().split("=")[1]).getTime() - new Date().getTime()
              ) +
              "`` (``" +
              output.stdout.trim().split("=")[1] +
              "``)"
          );
        }
      }
    } else {
      /* prettier-ignore */
      global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.yellow(interaction.user.tag)+" failed permission check.");
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
                                  (interaction.client.application.owner as Team).members.keys()
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
                                  (interaction.client.application.owner as Team).members.keys()
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

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const getSlashCommand = () => commandInfo.slashCommand;
export const commandCategory = () => commandInfo.category;