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
  ).getInteger("index", false) || Number.MAX_SAFE_INTEGER;


  const punishmentType = (
    interaction.options as CommandInteractionOptionResolver
  ).getString("offenses", true); // warn,mute:1d,ban:3d,ban

  const title = (
    interaction.options as CommandInteractionOptionResolver
  ).getString("title", true);

  const description = (
    interaction.options as CommandInteractionOptionResolver
  ).getString("description", true);

  const punishmentTypeArr = punishmentType.toLowerCase().split(",");
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
      index:punishmentIndex,
      type:punishmentType,
      time:punishmentDuration,
    });
  }

  const alreadyExistingRules = global.server.main.rules

  if (ruleNr > alreadyExistingRules.length + 1) {
    ruleNr = alreadyExistingRules.length + 1;
  }

  if (alreadyExistingRules.find((rule) => rule.index == ruleNr)) {
    // move them down
    alreadyExistingRules.forEach((rule) => {
      if (rule.index >= ruleNr) {
        rule.index++;
      }
    });
  }


  alreadyExistingRules.push({
    index: ruleNr,
    title: title,
    description: description,
    punishments: punishments
  });

  global.server.main.rules = alreadyExistingRules.sort((a, b) => a.index - b.index);

  const dbclient = new MongoClient(global.mongoConnectionString);
  try {
    const serverData = dbclient.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS").collection(
      global.app.config.debugging ? "DEVSRV_SD_" + global.app.config.mainServer : "serverdata"
    )

    await serverData.updateOne({ id: global.app.config.mainServer }, { $set: { rules: alreadyExistingRules } }).then(async () => {
      
      await interaction.reply({
        content: `Rule ${ruleNr} has been added.`,
        ephemeral: true,
      });

      dbclient.close();
    })
  } catch (e) {
    console.error(e);
    await interaction.reply({
      content: "An error occurred while adding the rule.",
      ephemeral: true,
    });
    dbclient.close();
  }





}

const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];