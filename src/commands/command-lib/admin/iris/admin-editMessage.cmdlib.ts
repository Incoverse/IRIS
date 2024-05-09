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

import Discord, { CommandInteractionOptionResolver, Message } from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { exec } from "child_process";
import prettyMilliseconds from "pretty-ms";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const execPromise = promisify(exec);
export async function runSubCommand(
  interaction: Discord.CommandInteraction
) { 
    await interaction.deferReply({ ephemeral: true })
    const messageId = (interaction.options as CommandInteractionOptionResolver).getString("message-id", true).trim()

    const channels = await interaction.guild.channels.fetch()
    let message: null | Message = null;
    for (const channel of channels.values()) {
        if (channel.type !== Discord.ChannelType.GuildText) continue;
        try {
            message = await channel.messages.fetch().then(a=>a.find(m => m.id === messageId))
            if (!message) continue;
            else break
        } catch (e) {
            continue;
        }
    }
    if (!message) return interaction.reply({ content: "Message not found" });
    // By bot
    if (message.author.id !== interaction.client.user.id) return interaction.reply({ content: "This message was not sent by me!" });
    // is editable
    if (!message.editable) return interaction.reply({ content: "This message is not editable!"});

    const newContent = (interaction.options as CommandInteractionOptionResolver).getString("text", true);

    await message.edit(newContent).catch((e) => interaction.editReply({ content: ("Failed to edit message: ``" + e.toString()+ "``")})).then(() => interaction.editReply({ content: "Message edited!"}))

}   
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
