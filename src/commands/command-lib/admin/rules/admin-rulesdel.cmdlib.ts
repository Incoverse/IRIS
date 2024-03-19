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
import { MongoClient } from "mongodb";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
  

  let ruleNr = (
    interaction.options as CommandInteractionOptionResolver
  ).getInteger("index", true);


  const rule = global.server.main.rules.find((r) => r.index === ruleNr);
  if (!rule) {
    await interaction.reply({
      content: "No rule with that index exists.",
      ephemeral: true,
    });
    return;
  }

  const newRules = global.server.main.rules.filter((r) => r.index !== ruleNr);

  //fix indexes
  let i = 0;
  for (const r of newRules.sort((a, b) => a.index - b.index)) {
    i++
    r.index = i;
  }

  global.server.main.rules = newRules;

  const dbclient = new MongoClient(global.mongoConnectionString);
  try {
    const serverData = dbclient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS").collection(
      global.app.config.debugging ? "DEVSRV_SD_" + global.app.config.mainServer : "serverdata"
    )

    await serverData.updateOne({ id: global.app.config.mainServer }, { $set: { rules: newRules } }).then(async () => {
      
      await interaction.reply({
        content: `Rule ${ruleNr} has been deleted.`,
        ephemeral: true,
      });

      dbclient.close();
    })
  } catch (e) {
    console.error(e);
    await interaction.reply({
      content: "An error occurred while deleting the rule.",
      ephemeral: true,
    });
    dbclient.close();
  }

}
const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];