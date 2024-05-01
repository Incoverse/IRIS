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

import Discord, { ButtonStyle } from "discord.js";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { promisify } from "util";
import { exec } from "child_process";
import { existsSync, readFileSync, writeFileSync, statSync } from "fs"
import { join } from "path"
const execPromise = promisify(exec);

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

let updateLink = ""

export async function runSubCommand(
  interaction: Discord.CommandInteraction
) {
    if (global.app.config.development) {
        return interaction.reply({
            content: "IRIS cannot be updated in development mode.",
        });
    }

    const sudo = global.app.config.lowPrivileged ? "sudo" : ""

    const user = interaction.user.discriminator != "0" && interaction.user.discriminator ? interaction.user.tag: interaction.user.username
    await interaction.deferReply();
    if (existsSync(join(process.cwd(), ".git")) && statSync(join(process.cwd(), ".git")).isDirectory()) {

        
        const currentBranch = (await execPromise(`${sudo} git branch --show-current`)).stdout.trim()
        await execPromise(`${sudo} git fetch origin ${currentBranch}`)
        const latestCommit = (await execPromise(`${sudo} git log -1 origin/${currentBranch} --pretty=format:%h`)).stdout.trim()
        const currentCommit = (await execPromise(`${sudo} git log -1 --pretty=format:%h`)).stdout.trim()

        if (latestCommit == currentCommit) {
            return interaction.editReply({
                content: "IRIS is already up to date.",
            });
        } else {
            const changes = (await execPromise(`${sudo} git rev-list --ancestry-path ${currentCommit}..${latestCommit} --format=%B`)).stdout.trim()
            const commitMessagesArray = changes.split("\n").filter(a => a.trim() != "" && !a.trim().startsWith("commit")).reverse()

            // add (latest) to the first commit message, then send it to the user in an embed's description with pagination (10 messages per page max). Give the user a "Update", and "Cancel" button
            const embeds = []
    
            let description = ""
            let commitCount = 0
            for (const message of commitMessagesArray) {
                if (commitCount == 10 || commitMessagesArray.indexOf(message) == commitMessagesArray.length - 1) {

                    if (commitMessagesArray.indexOf(message) == commitMessagesArray.length - 1) {
                        description += "- " + message + " - **(latest)**\n"
                    }

                    const embed = new Discord.EmbedBuilder()
                    .setTitle("An update is available!")
                    .setDescription((embeds.length == 0 ? "**Changes:**\n" : "") + description + "\n\n**Would you like to update IRIS?**")
                    
                    if (Math.floor(commitMessagesArray.length / 10) > 1) {
                        embed.setFooter({
                            text: "Page "+embeds.length+1+" of " + Math.floor(commitMessagesArray.length / 10).toString()
                        })
                    }
                    embeds.push(embed)
                    description = ""
                    commitCount = 0
                }

                description += "- " + message + "\n"
                commitCount++
            }

            const buttonsRows = []
            if (embeds.length > 1) {
                buttonsRows.push(new Discord.ActionRowBuilder().addComponents(
                    new Discord.ButtonBuilder().setCustomId("update:prev").setLabel("Previous").setStyle(ButtonStyle.Secondary).setDisabled(true),
                    new Discord.ButtonBuilder().setCustomId("update:next").setLabel("Next").setStyle(ButtonStyle.Secondary)
                ))
            }
            buttonsRows.push(new Discord.ActionRowBuilder().addComponents(
                new Discord.ButtonBuilder().setCustomId("update:yes").setLabel("Update").setStyle(ButtonStyle.Primary),
                new Discord.ButtonBuilder().setCustomId("update:no").setLabel("Cancel").setStyle(ButtonStyle.Danger)
            ))

            const msg = await interaction.editReply({
                embeds: [embeds[0]],
                components: buttonsRows
            })

            let currentPage = 0
            const collector = msg.createMessageComponentCollector({
                time: 600000 //? 10 minutes
            })

            collector.on("end", async (_, reason) => {
                if (reason == "time") {
                    await interaction.editReply({
                        content: "Update cancelled due to inactivity.",
                        components: [],
                        embeds: []
                    }).catch(() => {})
                }
            })

            collector.on("collect", async (i) => {

                if (i.user.id != interaction.user.id) {
                    i.reply({
                        content: "You are not allowed to interact with this message.",
                        ephemeral: true
                    })
                    return
                }
                    
                if (i.customId == "update:yes") {
                    await i.update({
                        components: [],
                        embeds: [
                            new Discord.EmbedBuilder()
                            .setTitle("Updating IRIS...")
                            .setDescription("IRIS is currently updating. All commands will be disabled until the update is complete.\n\nPlease wait...")
                        ]
                    })
                    global.status.updating = true

                    if (global.dataForSetup.events.includes("OnReadyRealTimeUpdate")) {
                        //! Tell ORRTU to shut down
                        global.communicationChannel.emit("ORRTU:shutdown")
                    }

                    await execPromise(`${sudo} git reset --hard`)
                    await execPromise(`${sudo} git pull`)
                    
                    await i.update({
                        embeds: [
                            new Discord.EmbedBuilder()
                            .setTitle("Update complete!")
                            .setDescription("IRIS has been updated successfully. IRIS will now restart.")
                        ]
                    })

                    await execPromise(`${sudo} systemctl restart iris`)
                    collector.stop()
                } else if (i.customId == "update:no") {
                    await i.update({
                        content: "Update cancelled.",
                        components: [],
                        embeds: []
                    })
                    collector.stop()
                } else if (i.customId == "update:prev") {
                    currentPage--
                    if (currentPage == 0) {
                        buttonsRows[0].components[0].setDisabled(true)
                    } else {
                        buttonsRows[0].components[1].setDisabled(false)
                    }
                    await i.update({
                        embeds: [embeds[currentPage]],
                        components: buttonsRows
                    })
                } else if (i.customId == "update:next") {
                    currentPage++
                    if (currentPage == embeds.length - 1) {
                        buttonsRows[0].components[1].setDisabled(true)
                    } else {
                        buttonsRows[0].components[0].setDisabled(false)
                    }
                    await i.update({
                        embeds: [embeds[currentPage]],
                        components: buttonsRows
                    })
                }
            })







            

        }
    }

}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
