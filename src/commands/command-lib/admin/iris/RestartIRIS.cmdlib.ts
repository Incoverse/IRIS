/*
  * Copyright (c) 2024 Inimi | InimicalPart | Incoverse
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

import Discord, { CommandInteractionOptionResolver, SlashCommandBuilder } from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import {exec} from "child_process";
const execPromise = promisify(exec);
import moment from "moment-timezone";
import { IRISSubcommand } from "@src/lib/base/IRISSubcommand.js";


export default class IRISRestart extends IRISSubcommand {

  static parentCommand = "Admin"

  public async setup(parentCommand: SlashCommandBuilder, client: Discord.Client<boolean>): Promise<boolean> {
      
    (parentCommand.options as any).find((option: any) => option.name == "iris")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("restart")
        .setDescription("Force a restart of IRIS.")
    )

    this._loaded = true;
    return true;
  }

  public async runSubCommand(interaction: Discord.CommandInteraction) {

    if (
      (interaction.options as CommandInteractionOptionResolver).getSubcommandGroup() !== "iris" ||
      (interaction.options as CommandInteractionOptionResolver).getSubcommand() !== "restart"
    ) return


    if (process.platform !== "linux") {
      return interaction.reply(
        "This command is disabled as this instance of IRIS is running on a " +
          process.platform.toUpperCase() +
          " system when we're expecting LINUX."
      );
    } else {
  
      if (global.app.config.development) {
        return interaction.reply({
          content: "IRIS cannot be restarted with this command in development mode.",
        });
      }
  
      const sudo = global.app.config.lowPrivileged ? "sudo" : ""
  
      const user = chalk.yellow(interaction.user.username)
      /* prettier-ignore */
      global.logger.debug(`${user} has restarted IRIS.`,returnFileName());
  
      await interaction.reply({
        content: "IRIS is now restarting...",
      });
      execPromise(`${sudo} systemctl restart IRIS`);
    }
  
  }


}

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(interaction: Discord.CommandInteraction) {
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];