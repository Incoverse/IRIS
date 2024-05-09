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

import Discord, { CommandInteractionOptionResolver, Team } from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import {exec} from "child_process";
import moment from "moment-timezone";
import storage from "@src/lib/utilities/storage.js";
import { IRISSubcommand } from "@src/lib/base/IRISSubcommand.js";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export default class DelEntry extends IRISSubcommand {
  static parentCommand: string = "Admin";

  public async setup(parentSlashCommand: Discord.SlashCommandBuilder): Promise<boolean> {

    (parentSlashCommand.options as any).find((option: any) => option.name == "entry")
    .addSubcommand(subcommand =>
        subcommand
            .setName("delete")
            .setDescription("Delete a user's entry from the database")
            .addUserOption(option =>
            option
                .setName("user")
                .setDescription("The user to delete the entry of")
                .setRequired(true)
            )
    );

    this._loaded = true;
    return true;
  }

  public async runSubCommand(interaction: Discord.CommandInteraction): Promise<any> {
      if (
        (interaction.options as CommandInteractionOptionResolver).getSubcommandGroup(true) !== "entry" ||
        (interaction.options as CommandInteractionOptionResolver).getSubcommand(true) !== "delete"
      ) return;
  
      const user = (
        interaction.options as CommandInteractionOptionResolver
      ).getUser("user", true);

      if (user.bot) {
        return await interaction.reply({
          content:
            "This user is a bot and cannot have an entry in the database!",
          ephemeral: true,
        });
      }

      await storage.deleteOne("user", { id: user.id });
      await interaction.reply({
        content:
            "**" +
              user.username +
              (user.username.endsWith("s") ? "'" : "'s") +
              "** entry has been successfully deleted.",
        ephemeral: true,
      });

    }
}


