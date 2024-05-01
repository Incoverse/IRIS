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
import { IRISGlobal } from "@src/interfaces/global.js"
import { fileURLToPath } from "url";
import storage from "@src/lib/utilities/storage.js";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
export async function runSubCommand(interaction: Discord.CommandInteraction) {
  
  let ruleName = (interaction.options as CommandInteractionOptionResolver).getString("rule", true);
  if (ruleName.match(/^[0-9]+\.\s/gm)) ruleName = ruleName.replace(/^[0-9]+\.\s/gm, ""); //! If the index accidentally gets added to the rule name, remove it.
  
  let newTitle = (interaction.options as CommandInteractionOptionResolver).getString("title", false);
  let newDescription = (interaction.options as CommandInteractionOptionResolver).getString("description", false);
  let newPunishments = (interaction.options as CommandInteractionOptionResolver).getString("offenses", false);

  if (!newTitle && !newDescription && !newPunishments) {
    await interaction.reply({
      content: "You must provide at least one new value to update.",
      ephemeral: true,
    });
    return;
  }


  let newRules = global.server.main.rules

  const rule = global.server.main.rules.find((rulee) => rulee.title == ruleName);

  if (!rule) {
      return await interaction.reply({
          content: "Rule not found.",
          ephemeral: true
      })
  }

  if (newTitle) {
    rule.title = newTitle;
  }
  if (newDescription) {
    rule.description = newDescription;
  }
  if (newPunishments) {
    const punishmentTypeArr = newPunishments.toLowerCase().split(",");
    const punishments = [];
    let punishmentIndex = 0
    for (const punishment of punishmentTypeArr) {
      punishmentIndex++;
      const punishmentMap = {
        "warn": "WARNING",
        "mute": "TIMEOUT",
        "kick": "KICK",
        "ban": "BANISHMENT"
      }
      const punishmentArr = punishment.split(":");
      let punishmentType = punishmentMap[punishmentArr[0]];
      if (!punishmentType) {
        await interaction.reply({
          content: `Invalid punishment type: ${punishmentArr[0]}`,
          ephemeral: true,
        });
        return;
      }
      const punishmentDuration = punishmentArr[1];
      if (!punishmentDuration && punishmentType == "BANISHMENT") {
          punishmentType = "PERMANENT_BANISHMENT";
        } else if (punishmentType == "BANISHMENT") {
          punishmentType = "TEMPORARY_BANISHMENT";
        }
        punishments.push({
          index: punishmentIndex,
          type: punishmentType,
          time: punishmentDuration
        })
    }
    rule.punishments = punishments;
  }

  global.server.main.rules = newRules;

  try {
    await storage.updateOne("server", {}, { $set: { rules: newRules } }).then(async () => {
      await interaction.reply({
        content: `Rule ${rule.index} has been updated.`,
        ephemeral: true,
      });
    })
  } catch (e) {
    global.logger.error(e.toString(), returnFileName());
    await interaction.reply({
      content: "An error occurred while updating the rule.",
      ephemeral: true,
    });
  }

}
const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};


export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];