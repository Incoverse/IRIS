/*
  * Copyright (c) 2023 Inimi | InimicalPart | InCo
  *
  * This program is free software: you can redistribute it and/or modify
  * it under the terms of the GNU General Public License as published by
  * the Free Software Foundation, either version 3 of the License, or
  * (at your option) any later version.
  *
  * This program is distributed in the hope that it will be useful,
  * but WITHOUT ANY WARRANTY; without even the implied warranty of
  * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  * GNU General Public License for more details.
  *
  * You should have received a copy of the GNU General Public License
  * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Discord, { Team } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import {exec} from "child_process";
const execPromise = promisify(exec);
import moment from "moment-timezone";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
  if (process.platform !== "linux") {
    return interaction.reply(
      "This command is disabled as this instance of IRIS is running on a " +
        process.platform.toUpperCase() +
        " system when we're expecting LINUX."
    );
  } else {
    /* prettier-ignore */
    global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.yellow(interaction.user.username)+" has restarted MongoDB.");

    interaction.deferReply();
    await execPromise("sudo systemctl restart mongod");
    await delay(1500)
    try {
      await execPromise(
        "sudo systemctl status mongod | grep 'active (running)' "
      );
    } catch (e) {
      /* prettier-ignore */
      global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.red("MongoDB failed to start!"));
      interaction.editReply(
        "⚠️ MongoDB has been restarted, but is not running due to a failure."
      );
      return;
      }
    /* prettier-ignore */
    global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.greenBright("MongoDB successfully started back up!"));
    interaction.editReply(
      ":white_check_mark: MongoDB has been restarted successfully."
    );
  }
}
const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];