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

import Discord, {CommandInteractionOptionResolver,} from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

import * as rulesAdd from "./command-lib/admin/rules/admin-rulesadd.cmdlib.js";
import * as rulesDelete from "./command-lib/admin/rules/admin-rulesdel.cmdlib.js";
import * as rulesEdit from "./command-lib/admin/rules/admin-rulesedit.cmdlib.js";
import * as rulesshow from "./command-lib/admin/rules/admin-rulesshow.cmdlib.js";

import { IRISCommand, IRISSlashCommand } from "@src/lib/base/IRISCommand.js";

declare const global: IRISGlobal;

export default class Admin extends IRISCommand {
  protected _slashCommand: IRISSlashCommand = new Discord.SlashCommandBuilder()
  .setName("admin")
  .setDescription("Admin Commands")
  .addSubcommandGroup((subcommandGroup) => //* RULES
    subcommandGroup
      .setName("rules")
      .setDescription("Commands to manage the rules")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("show")
          .setDescription("Show the rules stored in IRIS database.")
          .addStringOption((option) =>
            option
              .setName("rule")
              .setDescription("The rule you want to show")
              .setAutocomplete(true)
          )
          .addBooleanOption((option) =>
            option
              .setName("show-punishments")
              .setDescription("Whether to show the punishments for each rule")
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("add")
          .setDescription("Add a new rule")
          .addStringOption((option) =>
            option
              .setName("title")
              .setDescription("The title of the rule")
              .setRequired(true)              
          )
          .addStringOption((option) =>
            option
              .setName("description")
              .setDescription("The description of the rule")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("offenses")
              .setDescription("The punishment guidelines for the rule. e.g: 'warn,mute:1d,ban:3d,ban'")
              .setRequired(true)
            )
          .addIntegerOption((option) =>
            option
              .setName("index")
              .setDescription("The index of the rule")
          )
          )
          .addSubcommand((subcommand) =>
            subcommand
            .setName("delete")
            .setDescription("Delete a rule")
            .addStringOption((option) =>
              option
                .setName("rule")
                .setDescription("The rule you want to delete")
                .setRequired(true)
                .setAutocomplete(true)

            )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("edit")
          .setDescription("Edit a rule")
          .addStringOption((option) =>
            option
              .setName("rule")
              .setDescription("The rule you want to edit")
              .setRequired(true)
              .setAutocomplete(true)
          )
          .addStringOption((option) =>
            option
              .setName("title")
              .setDescription("The new title of the rule")
          )
          .addStringOption((option) =>
            option
              .setName("description")
              .setDescription("The new description of the rule")
          )
          .addStringOption((option) =>
            option
              .setName("offenses")
              .setDescription("The new punishment guidelines for the rule. e.g: 'warn,mute:1d,ban:3d,ban'")
          )
      )
  )

  public async autocomplete(interaction: Discord.AutocompleteInteraction) {
    const optionName = interaction.options.getFocused(true).name
    const focusedValue = interaction.options.getFocused();
    
    if (optionName == "rule") {
        const choices = global.server.main.rules.map((rule) => {
            return {
                name: `${rule.index}. ${rule.title}`,
                value: `${rule.title}`
            }
        })
           
        await interaction.respond(choices.filter((choice) => choice.name.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 25));
    }
  }

  public async runCommand(interaction: Discord.CommandInteraction) {
    for (let subcommand of Array.from(this._subcommands.values())) {
      await subcommand.runSubCommand(interaction);
    }
  }
  



}