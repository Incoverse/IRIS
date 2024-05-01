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
import storage from "@src/lib/utilities/storage.js";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
export async function runSubCommand(interaction: Discord.CommandInteraction) {
  

  let ruleName = (interaction.options as CommandInteractionOptionResolver).getString("rule", true);
  if (ruleName.match(/^[0-9]+\.\s/gm)) ruleName = ruleName.replace(/^[0-9]+\.\s/gm, ""); //! If the index accidentally gets added to the rule name, remove it.

  const rule = global.server.main.rules.find((rulee) => rulee.title == ruleName);

  if (!rule) {
      return await interaction.reply({
          content: "Rule not found.",
          ephemeral: true
      })
   }


  const newRules = global.server.main.rules.filter((r) => r.index !== rule.index);

  //fix indexes
  let i = 0;
  for (const r of newRules.sort((a, b) => a.index - b.index)) {
    i++
    r.index = i;
  }

  global.server.main.rules = newRules;

  try {

    await storage.updateOne("server", {}, { $set: { rules: newRules } }).then(async () => {
      
      await interaction.reply({
        content: `Rule ${rule.index} has been deleted.`,
        ephemeral: true,
      });

    })
  } catch (e) {
    global.logger.error(e.toString(), returnFileName());
    await interaction.reply({
      content: "An error occurred while deleting the rule.",
      ephemeral: true,
    });
  }

}
const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];