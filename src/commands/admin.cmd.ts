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

import * as restartMongoDB from "./command-lib/admin/system/admin-restartMongo.cmdlib.js";
import * as checkCertificate from "./command-lib/admin/system/admin-checkcert.cmdlib.js";

import * as restartIRIS from "./command-lib/admin/iris/admin-restart.cmdlib.js";
import * as stopIRIS from "./command-lib/admin/iris/admin-stop.cmdlib.js";
import * as logs from "./command-lib/admin/iris/admin-logs.cmdlib.js";
import * as editMessage from "./command-lib/admin/iris/admin-editMessage.cmdlib.js"

import * as changeBirthday from "./command-lib/admin/edit/admin-changeBirthday.cmdlib.js";
import * as changeTimezone from "./command-lib/admin/edit/admin-changeTimezone.cmdlib.js";

import * as entryManagement from "./command-lib/admin/entry/admin-entrymgmt.cmdlib.js";

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
  .addSubcommandGroup((subcommandGroup) => //* EDIT
    subcommandGroup
      .setName("edit")
      .setDescription("Commands to manage user's information in the database")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("birthday")
          .setDescription("Edit/get a user's birthday")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("The user whose birthday you want to edit")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("birthday")
              .setDescription(
                "The new birthday of the user (Format: YYYY-MM-DD), or 'null' to remove the birthday"
              )
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("timezone")
          .setDescription("Edit/get a user's timezone")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("The user whose timezone you want to edit")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("timezone")
              .setDescription(
                "The new timezone of the user (Format: Region/City), or 'null' to remove the timezone"
              )
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) => //* SYSTEM
    subcommandGroup
      .setName("system")
      .setDescription("Commands to manage the system")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("checkcert")
          .setDescription("Check when the SSL certificate expires.")
      )

      .addSubcommand((subcommand) =>
        subcommand
          .setName("restartmongo")
          .setDescription("Force a restart of MongoDB.")
      )
  )
  .addSubcommandGroup((subcommandGroup) => //* IRIS
      subcommandGroup
        .setName("iris")
        .setDescription("Commands to manage IRIS")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("restart")
            .setDescription("Force a restart of IRIS.")
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("stop").setDescription("Force-stop IRIS.")
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("logs").setDescription("Get IRIS' logs.")
        )
        .addSubcommand((subcommand) =>
        subcommand
          .setName("editmessage")
          .setDescription("Edit a message sent by IRIS.")
          .addStringOption((option) =>
            option
              .setName("message-id")
              .setDescription("The message ID of the message you want to edit.")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("text")
              .setDescription("The new text of the message.")
              .setRequired(true)
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) => //* ENTRY
    subcommandGroup
      .setName("entry")
      .setDescription("Commands to manage the database entries")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("delete")
          .setDescription("Delete a user's entry from the database")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("The user whose entry you want to delete")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("get")
          .setDescription("Get a user's entry from the database")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("The user whose entry you want to delete")
              .setRequired(true)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("create")
          .setDescription("Create a new entry in the database")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("The user whose entry you want to create")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("birthday")
              .setDescription("The birthday of the user (Format: YYYY-MM-DD)")
          )
          .addStringOption((option) =>
            option
              .setName("timezone")
              .setDescription(
                "The timezone of the user (Format: Region/City)"
              )
          )
      )
  )
  .addSubcommandGroup((subcommandGroup) => //* RULES

  /*
    /admin rules list
    /admin rules add [index] [title] [description]
    /admin rules delete <index>
    /admin rules edit <index> [new-title] [new-description]

    <> - required, [] - optional
  */
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
    try {
      const subcommandGroup = (
        interaction.options as CommandInteractionOptionResolver
      ).getSubcommandGroup(true);
      const subcommand = (
        interaction.options as CommandInteractionOptionResolver
      ).getSubcommand(true);
  
      if (subcommandGroup == "entry") {
        await entryManagement.runSubCommand(interaction);
      } else if (subcommandGroup == "edit") {
        if (subcommand == "timezone") {
          await changeTimezone.runSubCommand(interaction);
        } else if (subcommand == "birthday") {
          await changeBirthday.runSubCommand(interaction);
        }
      } else if (subcommandGroup == "system") {
        if (subcommand == "checkcert") {
          await checkCertificate.runSubCommand(interaction);
        } else if (subcommand == "restartmongo") {
          await restartMongoDB.runSubCommand(interaction);
        }
      } else if (subcommandGroup == "iris") {
        if (subcommand == "restart") {
          await restartIRIS.runSubCommand(interaction);
        } else if (subcommand == "stop") {
          await stopIRIS.runSubCommand(interaction);
        } else if (subcommand == "setpresence") {
          return await interaction.reply({
            content: "This command is currently disabled.",
            ephemeral: true,
          });
  
          //await setPresence.runSubCommand(interaction);
        } else if (subcommand == "logs") {
          await logs.runSubCommand(interaction);
        } else  if (subcommand == "editmessage") {
          await editMessage.runSubCommand(interaction);
        }
      } else if (subcommandGroup == "rules") {
        if (subcommand == "show") {
          await rulesshow.runSubCommand(interaction);
        } else if (subcommand == "add") {
          await rulesAdd.runSubCommand(interaction);
        } else if (subcommand == "delete") {
          await rulesDelete.runSubCommand(interaction);
        } else if (subcommand == "edit") {
          await rulesEdit.runSubCommand(interaction);
        }
      }
    } catch (e) {
      await interaction.client.application.fetch();
      global.logger.error(e, this.fileName);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "⚠️ There was an error while executing this command!" +
            (global.app.config.showErrors == true
              ? "\n\n``" +
                (global.app.owners.includes(interaction.user.id)
                  ? e.stack.toString()
                  : e.toString()) +
                "``"
              : ""),
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content:
            "⚠️ There was an error while executing this command!" +
            (global.app.config.showErrors == true
              ? "\n\n``" +
                (global.app.owners.includes(interaction.user.id)
                  ? e.stack.toString()
                  : e.toString()) +
                "``"
              : ""),
          ephemeral: true,
        });
      }
    }
  }
  



}