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

import Discord, { ButtonBuilder, ButtonStyle, ComponentBuilder, ComponentType } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import { PathLike, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

const commandInfo = {
    slashCommand: new Discord.SlashCommandBuilder()
        .setName("help")
        .setDescription("List all commands or info about a specific command.")
        .addStringOption(option =>
            option
                .setName("command")
                .setDescription("The command to get info about")
                .setRequired(false)
                .addChoices(
                  ...
                  Object.keys(global.requiredModules).filter(a => a.startsWith("cmd") && !a.includes("help")).map((moduleKey) => {
                    if (global.requiredModules[moduleKey].getSlashCommand().name == "help") {
                      return;
                    }
          
                    return {
                      name: global.requiredModules[moduleKey].getSlashCommand().name.toLowerCase(),
                      value: global.requiredModules[moduleKey].getSlashCommand().name.toLowerCase()
                    }
                  })
                )
                // .setAutocomplete(true)
        )
    .setDMPermission(false),
  // .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
  settings: {
    devOnly: false,
    mainOnly: false,
  },
}

export const setup = async (client: Discord.Client, RM: object) => true;

export async function runCommand(
    interaction: Discord.CommandInteraction,
    RM: object
) {
  try {
    // if no command was specified
    // list all commands in "pages", 5 commands per page 
    const commandOption = (interaction.options as Discord.CommandInteractionOptionResolver).getString("command", false);
    if (!commandOption?.trim()) {
      const pages = [];
      let commands = Object.keys(global.requiredModules).filter(a => a.startsWith("cmd") && !a.includes("help")).map((moduleKey) => {
      
        if (global.requiredModules[moduleKey].getSlashCommand().name == "help") {
          return;
        }

        return {
          name: global.requiredModules[moduleKey].getSlashCommand().name,
          description: global.requiredModules[moduleKey].getSlashCommand().description
        }
      }).filter(a => a != undefined);
      for (let i = 0; i < commands.length; i += 5) {
        const guildCommands = await (await interaction.client.guilds.fetch(global.app.config.mainServer)).commands.fetch();
        const page = new Discord.EmbedBuilder()
          .setTitle("All Commands")
          .setDescription(commands.slice(i, i + 5).map(command => {
            const commandId = Array.from(guildCommands.values()).filter(a => a.name == command.name).map(a => a.id)[0];
            return `</${command.name}:${commandId}> - ${command.description}`;
          }).join("\n"))
          .setColor("#FFFFFF")
          .setFooter({ text: `Page ${Math.floor(i / 5) + 1} of ${Math.ceil(commands.length / 5)}` });
        pages.push(page);
      }

      const message = await interaction.reply({
        embeds: [pages[0]],
        components: [new Discord.ActionRowBuilder<ButtonBuilder>().addComponents(
          new Discord.ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Secondary),
          new Discord.ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Secondary),
          new Discord.ButtonBuilder().setCustomId('delete').setLabel('Delete').setStyle(ButtonStyle.Danger)
        )],
        fetchReply: true,
      });

      const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

      collector.on('end', async collected => {
        if (collected.size === 0) {
          await message.delete();
        }
      });
      
      let currentPage = 0;

      collector.on('collect', async i => {
        if (i.customId === 'previous') {
          currentPage = currentPage > 0 ? --currentPage : pages.length - 1;
        } else if (i.customId === 'next') {
          currentPage = currentPage + 1 < pages.length ? ++currentPage : 0;
        } else if (i.customId === 'delete') {
          await message.delete();
          return;
        }

        await i.update({
          embeds: [pages[currentPage]],
          components: [new Discord.ActionRowBuilder<ButtonBuilder>().addComponents(
            new Discord.ButtonBuilder().setCustomId('previous').setLabel('Previous').setStyle(ButtonStyle.Secondary),
            new Discord.ButtonBuilder().setCustomId('next').setLabel('Next').setStyle(ButtonStyle.Secondary),
            new Discord.ButtonBuilder().setCustomId('delete').setLabel('Delete').setStyle(ButtonStyle.Danger)
          )]
        });
      });
    } else {
      const command = (interaction.options as Discord.CommandInteractionOptionResolver).getString("command")
      const guildCommands = await (await interaction.client.guilds.fetch(global.app.config.mainServer)).commands.fetch();
      const commandObject = Array.from(guildCommands.values()).find(a => a.name == command);
      // go through every file with cmd.ts and check for subcommands
      
      const files = readdirSync(join(dirname(__filename), "..")).filter((file: string) => {
        return file.endsWith(".cmd.ts");
      });
      let subcommands = [];
      for (let file of files) {
        const command = require(join(dirname(__filename), "..", file));
        if (command.getSlashCommand().name == "help") {
          continue;
        }
        subcommands.push(command.getSlashCommand().name);
      }

      if (!commandObject) {
        await interaction.reply({ content: `Command ${command} not found.`, ephemeral: true });
        return;
      }
      const commandId = commandObject.id;
      const commandDesc = commandObject.description;
      const commandEmbed = new Discord.EmbedBuilder()
        .setTitle(`/${command}`)
        .setDescription(`Usage: </${command}:${commandId}>`)
        .addFields({
          name: "Description",
          value: `${commandDesc}`
        },
        {
          name: "Subcommands",
          value: subcommands.length > 0 ? subcommands.join(', ') : 'None'
        })
        .setColor("#FFFFFF");
      await interaction.reply({
        embeds: [commandEmbed],
        ephemeral: true
      });
    }

    } catch (e) {
      global.logger.error(e, returnFileName());
      await interaction.client.application.fetch();
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