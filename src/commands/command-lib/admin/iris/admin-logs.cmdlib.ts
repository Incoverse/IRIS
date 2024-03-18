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

import Discord, { CommandInteractionOptionResolver, StringSelectMenuBuilder, Team } from "discord.js";
import { IRISGlobal } from "../../../../interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import {exec} from "child_process";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";
import {readdirSync, statSync} from "fs";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
    // get all files in logs/, and put them as fields in an embed, the value of the field being the creation date. to get the creation date, remove "IRIS-" and ".log" from the file name, pipe the output to new Date() and get a pretty date from that
    
    const logs = readdirSync("./logs").filter(file => file.endsWith(".log"));
    logs.sort((a, b) => {
        const aDate = parseInt(a.replace("IRIS-", "").replace(".log", ""));
        const bDate = parseInt(b.replace("IRIS-", "").replace(".log", ""));
        return bDate - aDate;
    });

    const embed = new Discord.EmbedBuilder()
    .setTitle("Logs")
    .setDescription("IRIS' logs.")
    .setColor("Default")
    .setTimestamp()
    .setFooter({
        text: "IRIS",
        iconURL: interaction.client.user.avatarURL()
    })
    .addFields(logs.map(log => {
        const date = new Date(parseInt(log.replace("IRIS-", "").replace(".log", "")));
        // add (latest) to the latest log
        const size = `${Math.round((statSync(`./logs/${log}`).size / 1024) * 100) / 100} KB`;
        return {
            name: date.toUTCString() + (log == logs[0] ? " (latest)" : ``),
            value: log + ` (${size})`
        }
    }))
    // create a select menu with all the logs, and when the user selects one, send the log file as a file
    const selectMenu = new Discord.StringSelectMenuBuilder()
    .setCustomId("log")
    .setPlaceholder("Select a log file")
    .addOptions(logs.map(log => {
        const size = `${Math.round((statSync(`./logs/${log}`).size / 1024) * 100) / 100} KB`;
        const date = new Date(parseInt(log.replace("IRIS-", "").replace(".log", "")));
        return {
            label: date.toUTCString() + (log == logs[0] ? " (latest)" : ``),
            value: log,
            description: log + ` (${size})`
        }       
    }));
    const actionRow = new Discord.ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(selectMenu)



    const message = await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true
    });

    const collector = message.createMessageComponentCollector({
        filter: (i) => i.user.id == interaction.user.id,
        time: 300000,
        max: 1
    });

    collector.on("collect", async (i) => {
        i = i as Discord.SelectMenuInteraction;
        const log = i.values[0];
        const file = `./logs/${log}`;
        await message.edit({
            files: [{
                attachment: file,
                name: log
            }],
            components: [],
            embeds: [],
            content: `Here is the log file you requested.`
        });
    }
    );

    collector.on("end", async (collected, reason) => {
        if (reason == "time") {
            await message.edit({
                content: "Timed out.",
                components: []
            });
        }
    }
    );





}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];



