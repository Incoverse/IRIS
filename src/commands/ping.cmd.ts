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

import * as Discord from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { IRISCommand, IRISSlashCommand } from "@src/lib/base/IRISCommand.js";

declare const global: IRISGlobal;
export default class Ping extends IRISCommand {
  protected _slashCommand: IRISSlashCommand = new Discord.SlashCommandBuilder()
    .setName("ping")
    .setDescription("Get the bot's ping.")



  public async runCommand(interaction: Discord.CommandInteraction) {
    await interaction.reply({
      embeds: [
        new Discord.EmbedBuilder()
          .setColor("NotQuiteBlack")
          .setTitle("Pong!")
          .setDescription(`🏓 ${interaction.client.ws.ping}ms`)
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL()
          })
      ]
    })
  }
};
