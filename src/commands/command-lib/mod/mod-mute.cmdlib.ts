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
import { IRISGlobal } from "../../../interfaces/global.js";
import { fileURLToPath } from "url";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
    
    function formatDuration(durationMs) {
        const units = [
            { label: 'y', ms: 1000 * 60 * 60 * 24 * 365 },
            { label: 'mo', ms: 1000 * 60 * 60 * 24 * 31},
            { label: 'w', ms: 1000 * 60 * 60 * 24 * 7 },
            { label: 'd', ms: 1000 * 60 * 60 * 24 },
            { label: 'h', ms: 1000 * 60 * 60 },
            { label: 'm', ms: 1000 * 60 },
            { label: 's', ms: 1000 },
            { label: 'ms', ms: 1 }
        ];
      
        let duration = durationMs;
        let durationStr = '';
      
        for (const unit of units) {
            const count = Math.floor(duration / unit.ms);
            if (count > 0) {
                durationStr += `${count}${unit.label} `;
                duration -= count * unit.ms;
            }
        }
      
        return durationStr.trim();
      }
      
      function parseDuration(durationStr) {
        const units = {
            'ms': 1,
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000,
            'mo': 1000 * 60 * 60 * 24 * 31,
            'y': 365 * 24 * 60 * 60 * 1000
        };
        
        if (!durationStr) {
            return null;
        }
        const match = durationStr.match(/(\d+)(\w+)/);
        if (!match) {
            return null;
        }

        const value = parseInt(match[1]);
        const unit = match[2];

        if (!units[unit]) {
            return null;
        }

        return value * units[unit];
        
      }

    const user = (
        interaction.options as CommandInteractionOptionResolver
    ).getUser("user", true);
    const reason = (
        interaction.options as CommandInteractionOptionResolver
    ).getString("reason", true);
    const duration = parseDuration((
        interaction.options as CommandInteractionOptionResolver
    ).getString("duration"))

    const deleteMessages = (
        interaction.options as CommandInteractionOptionResolver
    ).getBoolean("delete-messages");

    const member = interaction.guild.members.cache.get(user.id);
    const modLogChannel = interaction.guild.channels.cache.find(
        (channel) => channel.name === "mod-log"
    );

    // gnerate unix time for when the mute will endd
    const EndUnix = (Math.floor((Date.now() + duration) / 1000));

    if (!modLogChannel) {
        await interaction.reply({
            content: "No mod-log channel found, please create one and try again.",
            ephemeral: true,
        });
        return;
    }

    const mutedRole = interaction.guild.roles.cache.find(
        (role) => role.name === "Muted"
    );

    if (!mutedRole) {
        await interaction.reply({
            content: "No muted role found, please create one and try again.",
            ephemeral: true,
        });
        return;
    }

    if (member.roles.cache.has(mutedRole.id)) {
        await interaction.reply({
            content: "User is already muted.",
            ephemeral: true,
        });
        return;
    }

    const embed = new Discord.EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("Mute")
    .addFields(
        { name: "User", value: member.toString(), inline: true },
        { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
        { name: "Reason", value: reason }
    )
    .setThumbnail(member.user.avatarURL())
    .setTimestamp();

    if (!duration) {
        await member.roles.add(mutedRole.id);
        await member.timeout(2419200000);
        await interaction.reply({ content: "User has been muted **indefinitely.**", ephemeral: true });
    } else {
        await member.roles.add(mutedRole.id);
        setTimeout(() => {
            member.roles.remove(mutedRole.id);
            console.log(duration);
            const expired = new Discord.EmbedBuilder()
                .setColor("#00ff00")
                .setTitle("Unmuted")
                .addFields(
                    { name: "User", value: member.toString(), inline: true },
                    { name: "Moderator", value: `<@${interaction.user.id}>`, inline: true },
                    { name: "Reason", value: `Duration expired <t:${EndUnix}:R>` }
                )
                .setThumbnail(member.user.avatarURL())
                .setTimestamp();
            if (modLogChannel instanceof Discord.TextChannel) {
                modLogChannel.send({ embeds: [expired] });
            }
        }, duration);
        
        await interaction.reply({ content: `User has been muted for **${formatDuration(duration)}.**`, ephemeral: true });
        embed.addFields({ name: "Duration", value: `<t:${EndUnix}:R> (${formatDuration(duration)})` }); 
    }

    if (deleteMessages) {
        embed.addFields({ name: "Delete Messages", value: deleteMessages.toString() });
    }

    const punishment = `||MUTE|${user.id}|${duration || "0"}|${reason}|${interaction.user.id}||`;
    
    if (modLogChannel instanceof Discord.TextChannel) {
        await modLogChannel.send({ content: punishment, embeds: [embed] });
    }
}


export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];