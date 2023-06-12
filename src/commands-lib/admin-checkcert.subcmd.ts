/*
 * Copyright (c) 2023 Inimi | InimicalPart | Incoverse
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
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { exec } from "child_process";
import prettyMilliseconds from "pretty-ms";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const execPromise = promisify(exec);
export async function runSubCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  if (process.platform !== "linux") {
    return interaction.reply(
      "This command is disabled as this instance of IRIS is running on a " +
        process.platform.toUpperCase() +
        " system when we're expecting LINUX."
    );
  } else {
    await interaction.deferReply();
    let output = await execPromise(
      "openssl x509 -enddate -noout -in /etc/ssl/fullchain.pem"
    );
    let domain = await execPromise("openssl x509 -subject -noout -in /etc/ssl/fullchain.pem")
    interaction.editReply(
      "The certificate for ``"+domain.stdout.trim().split("=")[1].trim()+"`` expires in: ``" +
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
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
