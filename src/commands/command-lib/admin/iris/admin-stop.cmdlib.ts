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

import Discord from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";
const execPromise = promisify(exec);

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  const user = interaction.user.discriminator != "0" && interaction.user.discriminator ? interaction.user.tag: interaction.user.username
  /* prettier-ignore */
  global.logger.debug(`${chalk.yellow(user)} has stopped IRIS.`,returnFileName());

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
