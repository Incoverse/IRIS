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

import Discord, { CommandInteractionOptionResolver } from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
  const punishmentTypeMap= {
    "WARNING": "Warning",
    "TIMEOUT": "Timeout",
    "KICK": "Kick",
    "TEMPORARY_BANISHMENT": "Temporary ban",
    "PERMANENT_BANISHMENT": "Permanent ban"
  }
  const ruleNr = (
    interaction.options as CommandInteractionOptionResolver
  ).getInteger("index", false);

  let showPunishments = (
    interaction.options as CommandInteractionOptionResolver
  ).getBoolean("show-punishments", false);

  if (!showPunishments && showPunishments != false) showPunishments = false;

  if (ruleNr) {
    const rule = global.server.main.rules.find((r) => r.index === ruleNr);
    if (!rule) {
      await interaction.reply({
        content: "No rule with that number exists.",
        ephemeral: true,
      });
      return;
    }

    const ruleEmbed = new Discord.EmbedBuilder()
      .setTitle(`Rule ${rule.index}: ${rule.title}`)


    let description = rule.description+ (showPunishments? "\n\n**Punishments:**\n":"");
    for (const punishment of rule.punishments) {
      if (showPunishments) description += `- ${getOrdinalNum(punishment.index)} offense: *${punishmentTypeMap[punishment.type]}${punishment.time ? ` (${formatDuration(parseDuration(punishment.time))})` : ""}*\n`;
    }

    ruleEmbed.setDescription(description.trim());

    return await interaction.reply({ embeds: [ruleEmbed] });
  }


  let embeds = []

  if (global.server.main.rules.length === 0) {
    return await interaction.reply({
      content: "There are no rules set up.",
      ephemeral: true,
    });
  }

    let description = "";
    for (const rule of global.server.main.rules.sort((a, b) => a.index - b.index)) {
      if (description.length >= 4000) {
        const rulesEmbed = new Discord.EmbedBuilder()
          .setTitle(embeds.length === 0 ? "Rules" : "")
          .setDescription(description);
        embeds.push(rulesEmbed);
        description = "";
      }

      description += `- **${rule.index}. ${rule.title}**\n`;
      for (const punishment of rule.punishments) {
        description += ` - ${getOrdinalNum(punishment.index)} offense: *${punishmentTypeMap[punishment.type]}${punishment.time ? ` (${formatDuration(parseDuration(punishment.time))})` : ""}*\n`;
      }
    }

    embeds.push(new Discord.EmbedBuilder().setTitle(embeds.length === 0 ? "Rules" : "").setDescription(description));

    return await interaction.reply({ embeds: embeds });
    
}
const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};
function formatDuration(durationMs) {
  const units = [
      { label: 'y', ms: 1000 * 60 * 60 * 24 * 365 },
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
      'y': 365 * 24 * 60 * 60 * 1000
  };
  
  const duration = parseInt(durationStr.slice(0, -1)) * units[durationStr.slice(-1)];
  return duration;
}



const getOrdinalNum = (n:number)=> { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
