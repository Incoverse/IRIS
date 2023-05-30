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
const execPromise = promisify(exec);
export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
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
      let fullchainexists = existsSync("/etc/ssl/IRIS/fullchain.pem");
      let mongodpemexists = existsSync("/etc/ssl/IRIS/mongod.pem");
      if (fullchainexists && mongodpemexists) {
        output = await execPromise(
          "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
        );
        interaction.editReply(
          "Something errored for a second, I have gotten back the files now, The certificate expires in: ``" +
            prettyMilliseconds(
              new Date(output.stdout.trim().split("=")[1]).getTime() -
                new Date().getTime()
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
            (mongodpemexists
              ? "mongod.pem exists"
              : "mongod.pem missing!")
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
            new Date(output.stdout.trim().split("=")[1]).getTime() -
              new Date().getTime()
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
            new Date(output.stdout.trim().split("=")[1]).getTime() -
              new Date().getTime()
          ) +
          "`` (``" +
          output.stdout.trim().split("=")[1] +
          "``)"
      );
    }
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];