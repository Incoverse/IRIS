/*
 * Copyright (c) 2023 Inimi | InimicalPart | Incoverse
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

import Discord, {
  ActivityType,
  CommandInteractionOptionResolver,
  GuildMemberRoleManager,
  Team,
} from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
const __filename = fileURLToPath(import.meta.url);

const localReturnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];

global.logger.debug("Loading admin module '"+chalk.yellowBright("restartMongoDB")+"'...", localReturnFileName());
import * as restartMongoDB from "./command-lib/admin-restartMongo.cmdlib.js";
global.logger.debug("Loading admin module '"+chalk.yellowBright("restartIRIS")+"'...", localReturnFileName());
import * as restartIRIS from "./command-lib/admin-restart.cmdlib.js";
global.logger.debug("Loading admin module '"+chalk.yellowBright("checkCertificate")+"'...", localReturnFileName());
import * as checkCertificate from "./command-lib/admin-checkcert.cmdlib.js";
global.logger.debug("Loading admin module '"+chalk.yellowBright("stopIRIS")+"'...", localReturnFileName());
import * as stopIRIS from "./command-lib/admin-stop.cmdlib.js";
global.logger.debug("Loading admin module '"+chalk.yellowBright("changeBirthday")+"'...", localReturnFileName());
import * as changeBirthday from "./command-lib/admin-changeBirthday.cmdlib.js";
global.logger.debug("Loading admin module '"+chalk.yellowBright("changeTimezone")+"'...", localReturnFileName());
import * as changeTimezone from "./command-lib/admin-changeTimezone.cmdlib.js";
global.logger.debug("Loading admin module '"+chalk.yellowBright("entryManagement")+"'...", localReturnFileName());
import * as entryManagement from "./command-lib/admin-entrymgmt.cmdlib.js";
// global.logger.debug("Loading admin module '"+chalk.yellowBright("restartMongoDB")+"'...", localReturnFileName());
//import * as setPresence from "./command-lib/admin-setPresence.cmdlib.js";
global.logger.debug("Loading admin module '"+chalk.yellowBright("logs")+"'...", localReturnFileName());
import * as logs from "./command-lib/admin-logs.cmdlib.js";
global.logger.debug("Loading admin module '"+chalk.yellowBright("editMessage")+"'...", localReturnFileName());
import * as editMessage from "./command-lib/admin-editMessage.cmdlib.js"
global.logger.debug("Loading admin module '"+chalk.yellowBright("getStats")+"'...", localReturnFileName());
import * as getStats from "./command-lib/admin-getStatistics.cmdlib.js"

declare const global: IRISGlobal;
const commandInfo = {
    slashCommand: new Discord.SlashCommandBuilder()
    .setName("admin")
    .setDescription("Admin Commands")
    .addSubcommandGroup((subcommandGroup) =>
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
    .addSubcommandGroup((subcommandGroup) =>
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
    .addSubcommandGroup(
      (subcommandGroup) =>
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
        .addSubcommand((subcommand) =>
            subcommand
              .setName("getstats")
              .setDescription("Get server statistics in a graph.")
              .addStringOption((option) =>
                option
                  .setName("type")
                  .setDescription("The type of graph to get.")
                  .addChoices({
                    name: "Members",
                    value: "members",
                  },
                  {
                    name: "User joins",
                    value: "joins",
                  },
                  {
                    name: "User leaves",
                    value: "leaves",
                  },
                  {
                    name: "Online members",
                    value: "online",
                  },
                  {
                    name: "Messages sent",
                    value: "messages",
                  }
                  )
                  .setRequired(true)
              )
              .addStringOption((option) =>
                option
                  .setName("timeframe")
                  .setDescription("The timeframe of the graph.")
                  .addChoices(
                    // 1 day, 1 week, 1 month, 1 year
                    {
                      name: "1 day",
                      value: "1d",
                    },
                    {
                      name: "1 week",
                      value: "1w",
                    },
                    {
                      name: "1 month",
                      value: "1m",
                    },
                    {
                      name: "1 year",
                      value: "1y",
                    }

                  )
                  .setRequired(true)
              )
              .addIntegerOption((option) =>
                option
                  .setName("year")
                  .setDescription("The year of the data. (only when timeframe is 1y)")
                  .setRequired(false)
              )
              .addBooleanOption((option) =>
                option
                  .setName("raw")
                  .setDescription("Whether to send the data as a JSON file instead of a graph.")
                  .setRequired(false)
              )
              )
    )

    .addSubcommandGroup((subcommandGroup) =>
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
    ),

    //.setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
  settings: {
    devOnly: false,
    mainOnly: false,
  }
};

export const setup = async (client:Discord.Client, RM: object) => true

export async function runCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  try {
    const subcommandGroup = (
      interaction.options as CommandInteractionOptionResolver
    ).getSubcommandGroup(true);
    const subcommand = (
      interaction.options as CommandInteractionOptionResolver
    ).getSubcommand(true);

    if (subcommandGroup == "entry") {
      await entryManagement.runSubCommand(interaction, RM);
    } else if (subcommandGroup == "edit") {
      if (subcommand == "timezone") {
        await changeTimezone.runSubCommand(interaction, RM);
      } else if (subcommand == "birthday") {
        await changeBirthday.runSubCommand(interaction, RM);
      }
    } else if (subcommandGroup == "system") {
      if (subcommand == "checkcert") {
        await checkCertificate.runSubCommand(interaction, RM);
      } else if (subcommand == "restartmongo") {
        await restartMongoDB.runSubCommand(interaction, RM);
      }
    } else if (subcommandGroup == "iris") {
      if (subcommand == "restart") {
        await restartIRIS.runSubCommand(interaction, RM);
      } else if (subcommand == "stop") {
        await stopIRIS.runSubCommand(interaction, RM);
      } else if (subcommand == "setpresence") {
        return await interaction.reply({
          content: "This command is currently disabled.",
          ephemeral: true,
        });

        //await setPresence.runSubCommand(interaction, RM);
      } else if (subcommand == "logs") {
        await logs.runSubCommand(interaction, RM);
      } else  if (subcommand == "editmessage") {
        await editMessage.runSubCommand(interaction, RM);
      } else if (subcommand == "getstats") {
        await getStats.runSubCommand(interaction, RM);
      }
    }
  } catch (e) {
    await interaction.client.application.fetch();
    global.logger.error(e, returnFileName());
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

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const getSlashCommand = () => commandInfo.slashCommand;
export const commandSettings = () => commandInfo.settings;
