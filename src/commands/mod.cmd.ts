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

import Discord, {
    ActivityType,
    CommandInteractionOptionResolver,
    GuildMemberRoleManager,
    Team,
  } from "discord.js";
  import { IRISGlobal } from "@src/interfaces/global.js";
  import { fileURLToPath } from "url";
  import chalk from "chalk";
  const __filename = fileURLToPath(import.meta.url);
  
  
  const punishmentTypeMap= {
    "WARNING": "Warning",
    "TIMEOUT": "Timeout",
    "KICK": "Kick",
    "TEMPORARY_BANISHMENT": "Temporary ban",
    "PERMANENT_BANISHMENT": "Permanent ban"
  }


  declare const global: IRISGlobal;
  const commandInfo = {
      slashCommand: new Discord.SlashCommandBuilder()
      .setName("mod")
      .setDescription("Mod Commands")  
        .addSubcommand((subcommand) =>
        subcommand
            .setName("punish")
            .setDescription("Show the rules stored in IRIS database.")
            .addUserOption((option) =>
                option
                    .setName("user")
                    .setDescription("User to punish")
                    .setRequired(true)
            )
            .addStringOption((option) =>
            option
                .setName("rule")
                .setDescription("The rule that the user violated.")
                .setRequired(true)
                .setAutocomplete(true)
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

        const rule = (interaction.options as CommandInteractionOptionResolver).getString("rule");
        const user = (interaction.options as CommandInteractionOptionResolver).getUser("user");

        const violatedRule = global.server.main.rules.find((rulee) => rulee.title == rule);

        if (!violatedRule) {
            return await interaction.reply({
                content: "Rule not found.",
                ephemeral: true
            })
         }

        await interaction.deferReply({ephemeral: true});
        const modLogChannel = interaction.guild.channels.cache.find((channel) => ["mod-log","mod-logs"].includes(channel.name) && channel.type == Discord.ChannelType.GuildText);

        let usersOffenses = global.server.main.offenses[user.id]?.filter((offense) => offense.violation == violatedRule.title && offense.active == true);

        const userOffenseCount = usersOffenses?.length || 0;

        const newOffense = {
            violation: violatedRule.title,
            punishment_type: violatedRule.punishments[userOffenseCount].type,
            active: true,
            violated_at: new Date().toISOString(),
            ends_at: violatedRule.punishments[userOffenseCount].time ? new Date(Date.now() + parseDuration(violatedRule.punishments[userOffenseCount].time)).toISOString() : null,
            expires_at: null,
            offense_count: userOffenseCount+1
        }

        if (!global.server.main.offenses[user.id]) {
            global.server.main.offenses[user.id] = [newOffense]
        } else {
            global.server.main.offenses[user.id].push(newOffense)
        }
      

        if (newOffense.punishment_type == "WARNING") {
            await user.send({
                embeds: [
                    new Discord.EmbedBuilder()
                    .setDescription(`Hello ${user.displayName},\n\nYou have received a warning for violating rule:\n**${violatedRule.index}: ${violatedRule.title}**\n\nFurther violations may result in a more severe punishment.`)
                    .addFields({name:"Punishment Type", value:"Warning"})
                    .setColor(Discord.Colors.Yellow)
                    .setFooter({
                        text: "Sent from " + interaction.guild.name,
                        iconURL: interaction.guild.iconURL()
                    })
                    .setTimestamp()
                ]
            })
        }


        return await interaction.editReply({
            embeds: [
                new Discord.EmbedBuilder()
                .setDescription(`Punished ${user} for violating rule:\n**${violatedRule.index}: ${violatedRule.title}**`)
                .addFields(
                    {name: "Punishment Type", value: punishmentTypeMap[newOffense.punishment_type]},
                    {name: "Duration", value: newOffense.ends_at ? formatDuration(new Date(newOffense.ends_at).getTime() - Date.now()) : "∞"},
                    {name: "Offense Count", value: newOffense.offense_count.toString()}
                    )
                .setColor(Discord.Colors.Red)
                .setFooter({
                    text: "Sent from " + interaction.guild.name,
                    iconURL: interaction.guild.iconURL()
                })
                .setTimestamp()
            ]
        });



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
  
  export const autocomplete = async (interaction: Discord.AutocompleteInteraction, RM: object) => {
      
    if (interaction.options.getSubcommand() == "punish") {
        const focusedValue = interaction.options.getFocused();
        const choices = global.server.main.rules.map((rule) => {
            return {
                name: `${rule.index}. ${rule.title}`,
                value: `${rule.title}`
            }
        })
           
        await interaction.respond(choices.filter((choice) => choice.name.toLowerCase().includes(focusedValue.toLowerCase())).slice(0, 25));
    }
  }

  function formatDuration(durationMs) {
    const units = [
        { label: 'y', ms: 1000 * 60 * 60 * 24 * 365 },
        { label: 'mo', ms: 1000 * 60 * 60 * 24 * 31},
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
        'mo': 1000 * 60 * 60 * 24 * 31,
        'y': 365 * 24 * 60 * 60 * 1000
    };
    
    const time = parseInt(durationStr.replace(/[a-zA-Z]/g,""))
    const unit = durationStr.match(/[a-zA-Z]/g).join("")  
  
    const duration = time * units[unit];
    return duration;
  }
  

  export const returnFileName = () =>
    __filename.split(process.platform == "linux" ? "/" : "\\")[
      __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
    ];
  export const getSlashCommand = () => commandInfo.slashCommand;
  export const commandSettings = () => commandInfo.settings;