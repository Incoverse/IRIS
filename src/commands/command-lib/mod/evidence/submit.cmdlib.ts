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
import { getOffense, getUser, sendEmail } from "@src/lib/utilities/misc.js";
import storage from "@src/lib/utilities/storage.js";


declare const global: IRISGlobal;


export default class EvidenceSubmit extends IRISSubcommand {
  static parentCommand: string = "Mod";

  public async setup(parentSlashCommand: Discord.SlashCommandBuilder): Promise<boolean> {
    if (!global.app.config.appealSystem.website) return false;

    ((parentSlashCommand.options as any).find((option: any) => option.name == "evidence") as Discord.SlashCommandBuilder)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("submit")
        .setDescription("Submit evidence for a specific offense")
        .addStringOption(option => 
          option
            .setName("id")
            .setDescription("The ID of the offense")
            .setRequired(true)
        )
        .addStringOption(option =>
          option
          .setName("description")
          .setDescription("A description of the evidence")
          .setRequired(true)
        )
        .addAttachmentOption(option =>
          option
            .setName("attachment")
            .setDescription("The attachment to submit")
        )
        .addStringOption(option =>
          option
            .setName("link")
            .setDescription("A link to the evidence")
        )


    )
    this._loaded = true;
    return true;
  }

  public async runSubCommand(interaction: Discord.CommandInteraction): Promise<any> {
      if (
        (interaction.options as CommandInteractionOptionResolver).getSubcommandGroup(false) !== "evidence" ||
        (interaction.options as CommandInteractionOptionResolver).getSubcommand(false) !== "submit"
      ) return;

        const offenseID = (interaction.options as CommandInteractionOptionResolver).getString("id");

        const offense = await getOffense(null, offenseID);

        if (!offense) return interaction.reply({
            content: "Offense not found.",
            ephemeral: true
        })

        return

    }
}
