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

import * as restartMongoDB from "../commands-lib/admin-restartMongo.subcmd.js";
import * as restartIRIS from "../commands-lib/admin-restart.subcmd.js";
import * as checkCertificate from "../commands-lib/admin-checkcert.subcmd.js";
import * as stopIRIS from "../commands-lib/admin-stop.subcmd.js";
import * as changeBirthday from "../commands-lib/admin-changeBirthday.subcmd.js";
import * as changeTimezone from "../commands-lib/admin-changeTimezone.subcmd.js";
import * as entryManagement from "../commands-lib/admin-entrymgmt.subcmd.js";
import * as setPresence from "../commands-lib/admin-setPresence.subcmd.js";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
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
      // .addSubcommand((subcommand) =>
      // subcommand.setName("setpresence").setDescription("Set IRIS's presence.")
      //       .addStringOption((option) =>
      //         option
      //           .setName("text")
      //           .setDescription("The text to set IRIS's presence to. Use 'null' to remove the presence.")
      //           .setRequired(true)
      //       )
      //       .addStringOption((option) =>
      //         option
      //           .setName("type")
      //           .setDescription("The type of the presence.")
      //           .addChoices({
      //             name: "Playing",
      //             value: ActivityType.Playing.toString(),
      //           },
      //           {
      //             name: "Watching",
      //             value: ActivityType.Watching.toString(),
      //           },
      //           {
      //             name: "Listening",
      //             value: ActivityType.Listening.toString(),
      //           },
      //           {
      //             name: "Custom",
      //             value: ActivityType.Custom.toString(),
      //           })
      //       )
      // )

      // .addSubcommand((subcommand) =>
      // subcommand.setName("disableCommand").setDescription("Disable a command.")
      //       .addStringOption((option) =>
      //         option

      //           .setName("command")
      //           .setDescription("The command to disable.")
      //           .setRequired(true)
      //       )
      // )
      // .addSubcommand((subcommand) =>
      // subcommand.setName("enableCommand").setDescription("Enable a command.")
      //       .addStringOption((option) =>
      //         option

      //           .setName("command")
      //           .setDescription("The command to enable.")
      //           .setRequired(true)
      //       )
      // )
      // .addSubcommand((subcommand) =>
      // subcommand.setName("disableEvent").setDescription("Disable an event.")
      //       .addStringOption((option) =>
      //         option

      //           .setName("event")
      //           .setDescription("The event to disable.")
      //           .setRequired(true)
      //       )
      // )
      // .addSubcommand((subcommand) =>
      // subcommand.setName("enableEvent").setDescription("Enable an event.")
      //       .addStringOption((option) =>
      //         option

      //           .setName("event")
      //           .setDescription("The event to enable.")
      //           .setRequired(true)
      //       )
      // )
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
    )

    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};
export async function runCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  try {
    const adminPermissions = global.app.config.permissions.admin;
    /*
        * Check if the user has the required permissions to use this command

        * Get the allowed roles from the config file, if the bot is in development mode, use the development roles, else use the main roles
        * If the development roles are null, use the main roles
    */
    const AllowedRoles =
      process.env.DEVELOPMENT == "YES"
        ? adminPermissions.development == null
          ? adminPermissions.main
          : adminPermissions.development
        : adminPermissions.main;
    if (
      !(interaction.member.roles as GuildMemberRoleManager).cache.some((role) =>
        AllowedRoles.includes(role.name.toLowerCase())
      )
    ) {
      await interaction.reply({
        content: "You don't have permission to use this command!",
        ephemeral: true,
      });
      return;
    }
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
      } else if (subcommand == "restartMongo") {
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
      } else if (subcommand == "disableCommand") {
      } else if (subcommand == "disableCommand") {
      }
    }
  } catch (e) {
    await interaction.client.application.fetch();
    console.error(e);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true
            ? "\n\n``" +
              ([
                ...Array.from(
                  (interaction.client.application.owner as Team).members.keys()
                ),
                ...global.app.config.externalOwners,
              ].includes(interaction.user.id)
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
              ([
                ...Array.from(
                  (interaction.client.application.owner as Team).members.keys()
                ),
                ...global.app.config.externalOwners,
              ].includes(interaction.user.id)
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
export const commandCategory = () => commandInfo.category;
export const commandSettings = () => commandInfo.settings;
