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

import { CommandInteractionOptionResolver } from "discord.js";
import * as Discord from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { IRISSubcommand } from "@src/lib/base/IRISSubcommand.js";


declare const global: IRISGlobal;


export default class Unpunish extends IRISSubcommand {
  static parentCommand: string = "Mod";

  public async setup(parentSlashCommand: Discord.SlashCommandBuilder): Promise<boolean> {

    parentSlashCommand
    .addSubcommand((subcommand) =>
      subcommand
        .setName("unpunish")
        .setDescription("Revert a user's punishment.")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("User to punish")
                .setRequired(true)
        )
        .addStringOption((option) =>
        option
            .setName("rule")
            .setDescription("The rule that the user violated.")
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    this._loaded = true;
    return true;
  }

  public async runSubCommand(interaction: Discord.CommandInteraction): Promise<any> {
      if (
        (interaction.options as CommandInteractionOptionResolver).getSubcommand(false) !== "unpunish"
      ) return;

      return interaction.reply({
        content: "This command is not yet implemented.",
        ephemeral: true
      })

    }
}
