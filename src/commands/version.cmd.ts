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

import { IRISGlobal } from "@src/interfaces/global.js";
import Discord from "discord.js";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
    slashCommand: new Discord.SlashCommandBuilder()
    .setName("version")
    .setDescription("Check which version IRIS is running."),
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};
export const setup = async (client:Discord.Client) => true
export async function runCommand(
  interaction: Discord.CommandInteraction
) {
  try {
    await interaction.reply({
      content:
        "IRIS is currently running ``v" +
        JSON.parse(readFileSync("./package.json", { encoding: "utf-8" }))
          .version +
        "``",
      ephemeral: true,
    });
  } catch (e) {
    global.logger.error(e, returnFileName());
    await interaction.client.application.fetch();
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true
            ? "\n\n``" +
              (global.app.owners.includes(interaction.user.id)
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
              (global.app.owners.includes(interaction.user.id)
                ? e.stack.toString()
                : e.toString()) +
              "``"
            : ""),
        ephemeral: true,
      });
    }
  }
}
export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const getSlashCommand = () => commandInfo.slashCommand;

export const commandSettings = () => commandInfo.settings;
