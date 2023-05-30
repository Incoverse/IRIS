import Discord, { Team } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";
const execPromise = promisify(exec);
import moment from "moment-timezone";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  /* prettier-ignore */
  global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.yellow(interaction.user.tag)+" has stopped IRIS.");

  await interaction.reply({
    content: "IRIS is now stopping...",
  });
  if (global.app.config.development) {
    process.exit(0);
  } else {
    execPromise("sudo systemctl stop IRIS");
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
