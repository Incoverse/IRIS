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

import * as Discord from "discord.js";
import chalk from "chalk";
import storage from "@src/lib/utilities/storage.js";
import { IRISEvent, IRISEventTypeSettings, IRISEventTypes } from "@src/lib/base/IRISEvent.js";

import { IRISGlobal } from "@src/interfaces/global.js";
import { getInvolvedUsers, getOffense, getOffenses, getUser, hideSensitiveData, isAppealAdmin, punishmentControl, recalcOffensesAfter, saveUserEmail, sendEmail } from "@src/lib/utilities/misc.js";
import performance from "@src/lib/performance.js";
import { CronJob } from "cron";
declare const global: IRISGlobal;



export default class OnReadySetupPunishments extends IRISEvent {
  protected _type: IRISEventTypes = "onStart";
  protected _priority: number = 5;
  protected _typeSettings: IRISEventTypeSettings = {};


  private async ipcQueryHandler(client: Discord.Client, data: any): Promise<void> {

    if (data.type === "mod:offenses:get") {
      global.communicationChannel.emit("ipc-query-"+data.nonce, {
          user_id: data.data.user_id,
          offenses: await getOffenses(data.data.user_id, true)
      });
    } else if (data.type === "db:user:saveEmail") {
      if (!data.data.email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.data.email)) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_EMAIL",
          message: "The email provided is invalid.",
        });
        return;
      }

      await saveUserEmail(data.data.user_id, data.data.email).catch((e) => {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: e.message,
        });
        return;
      })
      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        email: data.data.email,
      });
    } else if (data.type === "mod:offense:get") {
      const offense = await getOffense(data.data.user_id, data.data.offense_id, true);

      if (!offense) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      global.communicationChannel.emit("ipc-query-"+data.nonce, {
          offense: offense,
      });
    } else if (data.type === "mod:appeal:getUsers" || data.type === "mod:admin:appeal:getUsers") {


      const users = await getInvolvedUsers(client, data.data.offense_id, data.type === "mod:appeal:getUsers")

      if (!users) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      global.communicationChannel.emit("ipc-query-"+data.nonce, {
          id: data.data.offense_id,
          users: users,
      });
    } else if (data.type === "mod:appeal:create") {
      const offense = await getOffense(data.data.user_id, data.data.offense_id);
      if (!offense || offense.user_id !== data.data.user_id) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      if (!offense.status || offense.status !== "ACTIVE") {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This action is invalid for this offense.",

        });
        return;
      }

      if (!data.data.message || data.data.message.length < 1 || data.data.message.length > 2000) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "Message must be between 1 and 2000 characters.",
        });
        return;
      }


      offense.status = "APPEALED"
      offense.appeal = {
        status: "OPEN",
        transcript: [
          {
            type: "message",
            message: data.data.message,
            timestamp: new Date().toISOString(),
            user_id: data.data.user_id,
          }
        ],
        miscellaneous: {},
      }


      //! Add appeal to Discord as a channel
      const channels = await client.guilds.cache.get(global.app.config.mainServer).channels.fetch()
      const category = channels.find((channel) => channel.type === Discord.ChannelType.GuildCategory && channel.name.toLowerCase().includes("appeals")); 
      const appealingUser = client.users.cache.get(data.data.user_id) ?? await client.users.fetch(data.data.user_id)
      const punisherUser = client.users.cache.get(offense.action_taken_by) ?? await client.users.fetch(offense.action_taken_by)

      if (category) {
        const offenseChannels = Array.from(channels.values()).filter((channel) => channel.parentId === category.id);

        //! If there is a channel for the user (e.g appeal-theinimi), make a new one and title it appeal-theinimi-2, etc.
        let channelName = `appeal-${appealingUser.username}`;
        let userChannel = offenseChannels.find((channel) => channel.name === `${channelName}`);
        if (userChannel) {
          channelName += "-"+(offenseChannels.filter((channel) => channel.name.startsWith(`${channelName}`)).length + 1);
        }
        const newChannel = await client.guilds.cache.get(global.app.config.mainServer).channels.create({...{
          name: channelName,
          parent: category.id,
          type: Discord.ChannelType.GuildText,
          reason: `Appeal for offense #${data.data.offense_id} created by @${appealingUser.username}.`,
          topic: `
**OID**: #${data.data.offense_id}
**Violation**: ${offense.rule_index}. ${offense.violation}
**Violated on**: ${new Date(offense.violated_at).toUTCString()}
**Punishment**: ${offense.punishment_type}${offense.original_duration ? ` (${offense.original_duration})` : ""}
**Punished by**: @${punisherUser.username} (${offense.action_taken_by})

**Appealed by**: @${appealingUser.username} (${data.data.user_id})
**Appealed on**: ${new Date().toUTCString()}
`.trim(),     
        },
      ...(userChannel ? {position: userChannel.position + 1} : {})
    })

        await newChannel.send({
          embeds: [
            new Discord.EmbedBuilder()
              .setTitle(`Appeal for offense #${data.data.offense_id}`)
              .setDescription(`**Appealed by**: @${appealingUser.username} (${data.data.user_id})`)
              .setFooter({text:`Appeal created on ${new Date().toUTCString()}`})
              .addFields(
                { name: "Violation", value: `${offense.rule_index}. ${offense.violation}` },
                { name: "Violated on", value: new Date(offense.violated_at).toUTCString() },
                { name: "Punishment", value: `${offense.punishment_type}${offense.original_duration ? ` (${offense.original_duration})` : ""}` },
              )
          ]
        })

        const webhook = await newChannel.createWebhook({
          name: (appealingUser.displayName + ` (@${appealingUser.username})`) || appealingUser.username,
          avatar: appealingUser.displayAvatarURL({extension: "png", size: 512}),
          reason: `Appeal for offense #${data.data.offense_id} created by @${appealingUser.username}. (Webhook used for easier readability.)`,
        })

        offense.appeal.miscellaneous.discordChannelID = newChannel.id;
        if (!offense.appeal.miscellaneous.webhookIDs) {
          offense.appeal.miscellaneous.webhookIDs = {
            [data.data.user_id]: webhook.id
          }
        }
        await webhook.send({
          content: data.data.message.replace(/&gt;/, "\\>").replace(/&lt;/, "\\<"),
          allowedMentions: {parse: []},
        })
      }

      const guild = client.guilds.cache.get(global.app.config.mainServer);

      let modLogChannel = guild.channels.cache.find((channel) => ["mod-log","mod-logs"].includes(channel.name) && channel.type == Discord.ChannelType.GuildText)
      if (modLogChannel) {
        modLogChannel = await modLogChannel.fetch();
        (modLogChannel as Discord.TextChannel).send({
            embeds: [
              new Discord.EmbedBuilder()
                .setThumbnail(appealingUser.displayAvatarURL())
                .setAuthor({
                  name: appealingUser.username + " (" + appealingUser.id + ")",
                  iconURL: appealingUser.displayAvatarURL()
                })
                .setTitle("Appeal Created")
                .addFields(
                    {name:"Offense ID", value: data.data.offense_id.toString(), inline:true},
                    {name:"Violation", value: `${offense.rule_index}. ${offense.violation}`, inline:true},
                    {name:"Violated on", value: new Date(offense.violated_at).toUTCString()},
                    {name:"Punishment", value: `${offense.punishment_type}${offense.original_duration ? ` (${offense.original_duration})` : ""}`, inline:true},
                    {name:"Offense count", value: offense.offense_count.toString(), inline:true},
                    )
                .setColor(
                  Discord.Colors.DarkGreen
                )
                .setTimestamp()
                .setFooter({
                  text: "Punished by " + punisherUser.username,
                  iconURL: punisherUser.displayAvatarURL()
                })
            ],
        })
      }

      await storage.replaceOne("offense", { id: offense.id }, offense);

      global.communicationChannel.emit("ipc-query-"+data.nonce, {
          status: offense.status,
          transcript: offense?.appeal?.transcript ?? [],
          appeal_status: offense?.appeal?.status,
      });
    } else if (data.type === "mod:appeal:get") {
      const offense = await getOffense(data.data.user_id, data.data.offense_id, true);
      if (!offense) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      global.communicationChannel.emit("ipc-query-"+data.nonce, {
          status: offense.status,
          transcript: offense?.appeal?.transcript ?? [],
          appeal_status: offense?.appeal?.status,
      });
    } else if (data.type === "mod:appeal:message:create" || data.type === "mod:admin:appeal:message:create") {
      const offense = await getOffense(data.data.user_id, data.data.offense_id);
      if (!offense) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      if ((!offense.status || offense.status !== "APPEALED") && !data.data.admin) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This action is invalid for this offense.",
        });
        return;
      }


      if (!data.data.message || data.data.message.length < 1 || data.data.message.length > 2000) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "Message must be between 1 and 2000 characters.",
        });
        return;
      }

      offense.appeal.transcript.push({
        type: "message",
        message: data.data.message,
        timestamp: new Date().toISOString(),
        user_id: data.data.admin ? data.data.send_as : data.data.user_id,
        ...(data.data.anonymous ? {anonymous: true} : {})
      })

      if (offense.appeal.status === "AYR" && !data.data.admin) {
        offense.appeal.status = "OPEN";
      } else if (offense.appeal.status === "OPEN" && data.data.admin) {
        offense.appeal.status = "AYR";
      }

      if (offense.appeal?.miscellaneous?.discordChannelID) {
        let offenseChannel = await client.guilds.cache.get(global.app.config.mainServer).channels.fetch(offense.appeal?.miscellaneous?.discordChannelID) as Discord.TextChannel;

        if (offenseChannel) {

          await offenseChannel.fetchWebhooks().then(async (webhooks) => {
            const userWebhook = webhooks.find((webhook) => webhook.id === offense.appeal?.miscellaneous?.webhookIDs[data.data.admin ? data.data.send_as : data.data.user_id]);
            const user = data.data.admin ? await getUser(client, data.data.send_as) : await getUser(client, data.data.user_id);

            if (userWebhook) {
              userWebhook.send({
                content: data.data.message.replace(/&gt;/, "\\>").replace(/&lt;/, "\\<"),
                allowedMentions: {parse: []},
                ...(data.data.anonymous ? {username: user.name + ` (@${user.username}) (Anonymously)`} : {})
              })
            } else {
  
              await offenseChannel.createWebhook({
                name: user.name + ` (@${user.username})`,
                avatar: user.image,
                reason: `Appeal message for offense #${data.data.offense_id} created by @${user.username}. (Webhook used for easier readability.)`,
              }).then(async (webhook) => {
                webhook.send({
                  content: data.data.message.replace(/&gt;/, "\\>").replace(/&lt;/, "\\<"),
                  allowedMentions: {parse: []},
                  ...(data.data.anonymous ? {username: user.name + ` (@${user.username}) (Anonymously)`} : {})
                })
                offense.appeal.miscellaneous.webhookIDs[data.data.admin ? data.data.send_as : data.data.user_id] = webhook.id;
              })
            }
  
          
          })
          
        }
      }

      await storage.replaceOne("offense", { id: offense.id }, offense);

      if (offense.appeal.status == "AYR" && data.data.admin) {
        if (global.app.config.appealSystem.emailSocketPath) {

          const appealClosedSubject = "[#{offenseID}] - Appeal Updated"
          const appealClosedEmail = "<h1>Appeal Updated</h1><br/>Hello {name},<br/><br/>Your appeal of offense #{offenseID} has been updated.<br/><a href=\"{appealLink}\">Click here to view the appeal</a><br/><br/>- Staff Team at {serverName}"
          
          
  
          const guild = client.guilds.cache.get(global.app.config.mainServer) ?? await client.guilds.fetch(global.app.config.mainServer);
          storage.findOne("user", { id: offense.user_id }).then(async (user)=>{
            const email = user.email;
            if (email) {
              const emailText = appealClosedEmail
                .replaceAll("{name}", await getUser(client, offense.user_id).then((a)=>a.name))
                .replaceAll("{offenseID}", offense.id)
                .replaceAll("{appealLink}", global.app.config.appealSystem.website + "/offenses/" + offense.id)
                .replaceAll("{serverName}", guild.name)
                .replaceAll("{closeStatus}", "accepted")
                // .replaceAll("{serverIconLink}", interaction.guild.iconURL({size: 16, extension: "png"}))
  
              sendEmail(email, appealClosedSubject.replace("{offenseID}", offense.id), emailText).catch((a)=>global.logger.error(a,this.fileName))
            }
          })
        }
      }
    
    
      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        status: offense.status,
        transcript: (data.data.admin ? offense?.appeal?.transcript : (hideSensitiveData(offense))?.appeal?.transcript) ?? [],
        appeal_status: offense?.appeal?.status,
      });
      
      
    } else if (data.type === "mod:admin:is") {
      
      const appealAdmin = await isAppealAdmin(client, data.data.user_id)
      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        admin: appealAdmin,
      });
    } else if (data.type === "mod:admin:users") {
      const allOffenses: Offense[] = await storage.find("offense", {});
      
      // get the user_id from each offense as well as when the offense was created, and the offense status. but group them by user_id
      let users = allOffenses.reduce((acc, offense: Offense) => {
        if (!acc[offense.user_id]) acc[offense.user_id] = [];
        acc[offense.user_id].push({
          id: offense.id,
          status: offense.status,
          violated_at: offense.violated_at,
          appealStatus: offense.appeal?.status ?? null,
          appealed_at: offense.appeal?.transcript[0]?.timestamp ?? null,
          rule_index: offense.rule_index,
          violation: offense.violation,
        });
        return acc;
      }, {});
      
      users = await Promise.all(Object.keys(users).map(async (user_id) => {
        return {
          user: await getUser(client, user_id),
          offenses: users[user_id]
        }
      }))
      
      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        users: users,
      });
      
      
      
    } else if (data.type === "mod:admin:user") {
      const user = await getUser(client, data.data.user_id);
      if (!user) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This user does not exist.",
        });
        return;
      }

      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        user: user,
      });
    } else if (data.type === "mod:admin:users:offenses") {
      const offenses = await getOffenses(data.data.user_id, true)
      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        offenses: offenses,
      });
    } else if (data.type === "mod:admin:offense:toggleAppealment") {
      const offense = await getOffense(data.data.user_id, data.data.offense_id);
      if (!offense) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      if (offense.appeal && offense.can_appeal) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This action is invalid for this offense.",
        });
        return;
      }

      offense.can_appeal = !offense.can_appeal;

      await storage.replaceOne("offense", { id: offense.id }, offense);

      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        can_appeal: offense.can_appeal,
      });
    } else if (data.type === "mod:admin:offense:revoke") {
      const offense = await getOffense(null, data.data.offense_id);
      if (!offense) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      if (!["ACTIVE", "APPEALED"].includes(offense.status)) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This action is invalid for this offense.",
        });
        return;
      }

      offense.status = "REVOKED";
      if (!offense.appeal) {
        offense.appeal = {
          status: "APPROVED",
          transcript: [
            {
              type: "status",
              status: "APPROVED",
              timestamp: new Date().toISOString(),
              user_id: data.data.closer_id,
            }
          ],
          miscellaneous: {},
        }
      } else {
        offense.appeal.status = "APPROVED";
        offense.appeal.transcript.push({
          type: "status",
          status: "APPROVED",
          timestamp: new Date().toISOString(),
          user_id: data.data.closer_id,
        })

        const guild = client.guilds.cache.get(global.app.config.mainServer) ?? await client.guilds.fetch(global.app.config.mainServer);
        const offenseUser = client.users.cache.get(offense.user_id) ?? await client.users.fetch(offense.user_id)
        const closerUser = client.users.cache.get(data.data.closer_id) ?? await client.users.fetch(data.data.closer_id)
        let modLogChannel = guild.channels.cache.find((channel) => ["mod-log","mod-logs"].includes(channel.name) && channel.type == Discord.ChannelType.GuildText)
        if (modLogChannel) {
           modLogChannel.fetch().then((channel) => {
          (channel as Discord.TextChannel).send({
              embeds: [
                new Discord.EmbedBuilder()
                  .setThumbnail(offenseUser.displayAvatarURL())
                  .setAuthor({
                    name: offenseUser.username + " (" + offenseUser.id + ")",
                    iconURL: offenseUser.displayAvatarURL()
                  })
                  .setTitle("Appeal Closed")
                  .addFields(
                      {name:"Offense ID", value: offense.id.toString(), inline:true},
                      {name:"Violation", value: `${offense.rule_index}. ${offense.violation}`, inline:true},
                      {name:"Violated on", value: new Date(offense.violated_at).toUTCString()},
                      {name:"Punishment", value: `${offense.punishment_type}${offense.original_duration ? ` (${offense.original_duration})` : ""}`, inline:true},
                      {name:"Offense count", value: offense.offense_count.toString(), inline:true},
                      {name:"Status", value: "Approved"},
                      )
                  .setColor(
                    Discord.Colors.DarkRed
                  )
                  .setTimestamp()
                  .setFooter({
                    text: "Closed by " + closerUser.username,
                    iconURL: closerUser.displayAvatarURL()
                  })
              ],
          })
        })
        }


        if (offense.appeal?.miscellaneous?.discordChannelID) {
          const channel = await client.guilds.cache.get(global.app.config.mainServer).channels.fetch(offense.appeal?.miscellaneous?.discordChannelID) as Discord.TextChannel;
          channel.delete("Appeal approved.")
          delete offense.appeal.miscellaneous.discordChannelID
          delete offense.appeal.miscellaneous.webhookIDs
        }
      }

      await storage.replaceOne("offense", { id: offense.id }, offense);

      for (let eventType of [`user:${offense.user_id}:offenses:${offense.id}`, `user:${offense.user_id}:offenses`]) {
        global.communicationChannel.emit(eventType, {type: "APPEAL_UPDATE", data: {
          id: offense.id,
          offense: (hideSensitiveData(offense))
        }})
      }

      await recalcOffensesAfter(client, offense.id);

      const newOffenses = await getOffenses(offense.user_id, true)

      punishmentControl(client, newOffenses);

      if (global.app.config.appealSystem.emailSocketPath) {

        const appealClosedSubject = "[#{offenseID}] - Appeal Updated"
        const appealClosedEmail = "<h1>Appeal Updated</h1><br/>Hello {name},<br/><br/>Your appeal of offense #{offenseID} has been closed as {closeStatus}. For more information, check your appeal on the website.<br/><a href=\"{appealLink}\">Click here to view the appeal</a><br/><br/>- Staff Team at {serverName}"
        
        

        const guild = client.guilds.cache.get(global.app.config.mainServer) ?? await client.guilds.fetch(global.app.config.mainServer);
        storage.findOne("user", { id: offense.user_id }).then(async (user)=>{
          const email = user.email;
          if (email) {
            const emailText = appealClosedEmail
              .replaceAll("{name}", await getUser(client, offense.user_id).then((a)=>a.name))
              .replaceAll("{offenseID}", offense.id)
              .replaceAll("{appealLink}", global.app.config.appealSystem.website + "/offenses/" + offense.id)
              .replaceAll("{serverName}", guild.name)
              .replaceAll("{closeStatus}", "accepted")
              // .replaceAll("{serverIconLink}", interaction.guild.iconURL({size: 16, extension: "png"}))

            sendEmail(email, appealClosedSubject.replace("{offenseID}", offense.id), emailText).catch((a)=>global.logger.error(a,this.fileName))
          }
        })
      }

      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        offenses: newOffenses,
      });


    } else if (data.type === "mod:admin:appeal:deny") {
      const offense = await getOffense(null, data.data.offense_id);
      if (!offense) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      if (!["APPEALED"].includes(offense.status)) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This action is invalid for this offense.",
        });
        return;
      }

      offense.status = "ACTIVE";
      if (!offense.appeal) {
        offense.appeal = {
          status: "DENIED",
          transcript: [
            {
              type: "status",
              status: "DENIED",
              timestamp: new Date().toISOString(),
              user_id: data.data.closer_id,
            }
          ],
          miscellaneous: {},
        }
      } else {
        offense.appeal.status = "DENIED";
        offense.appeal.transcript.push({
          type: "status",
          status: "DENIED",
          timestamp: new Date().toISOString(),
          user_id: data.data.closer_id,
        })

        const guild = client.guilds.cache.get(global.app.config.mainServer) ?? await client.guilds.fetch(global.app.config.mainServer);
        const offenseUser = client.users.cache.get(offense.user_id) ?? await client.users.fetch(offense.user_id)
        const closerUser = client.users.cache.get(data.data.closer_id) ?? await client.users.fetch(data.data.closer_id)
        let modLogChannel = guild.channels.cache.find((channel) => ["mod-log","mod-logs"].includes(channel.name) && channel.type == Discord.ChannelType.GuildText)
        if (modLogChannel) {
           modLogChannel.fetch().then((channel) => {
          (channel as Discord.TextChannel).send({
              embeds: [
                new Discord.EmbedBuilder()
                  .setThumbnail(offenseUser.displayAvatarURL())
                  .setAuthor({
                    name: offenseUser.username + " (" + offenseUser.id + ")",
                    iconURL: offenseUser.displayAvatarURL()
                  })
                  .setTitle("Appeal Closed")
                  .addFields(
                      {name:"Offense ID", value: offense.id.toString(), inline:true},
                      {name:"Violation", value: `${offense.rule_index}. ${offense.violation}`, inline:true},
                      {name:"Violated on", value: new Date(offense.violated_at).toUTCString()},
                      {name:"Punishment", value: `${offense.punishment_type}${offense.original_duration ? ` (${offense.original_duration})` : ""}`, inline:true},
                      {name:"Offense count", value: offense.offense_count.toString(), inline:true},
                      {name:"Status", value: "Denied"},
                      )
                  .setColor(
                    Discord.Colors.DarkRed
                  )
                  .setTimestamp()
                  .setFooter({
                    text: "Closed by " + closerUser.username,
                    iconURL: closerUser.displayAvatarURL()
                  })
              ],
          })
        })
        }


        if (offense.appeal?.miscellaneous?.discordChannelID) {
          const channel = await client.guilds.cache.get(global.app.config.mainServer).channels.fetch(offense.appeal?.miscellaneous?.discordChannelID) as Discord.TextChannel;
          channel.delete("Appeal closed.")
          delete offense.appeal.miscellaneous.discordChannelID
          delete offense.appeal.miscellaneous.webhookIDs
        }
      }

      await storage.replaceOne("offense", { id: offense.id }, offense);

      for (let eventType of [`user:${offense.user_id}:offenses:${offense.id}`, `user:${offense.user_id}:offenses`]) {
        global.communicationChannel.emit(eventType, {type: "APPEAL_UPDATE", data: {
          id: offense.id,
          offense: (hideSensitiveData(offense))
        }})
      }

      await recalcOffensesAfter(client, offense.id);

      const newOffenses = await getOffenses(offense.user_id, true)

      punishmentControl(client, newOffenses);


      global.communicationChannel.emit("ipc-query-"+data.nonce, {
        offenses: newOffenses,
      });


    } else if (data.type === "mod:admin:offense:get") {
      const offense = await getOffense(data.data.user_id, data.data.offense_id);

      if (!offense) {
        global.communicationChannel.emit("ipc-query-"+data.nonce, {
          error: "INVALID_ACTION",
          message: "This offense does not exist.",
        });
        return;
      }

      global.communicationChannel.emit("ipc-query-"+data.nonce, {
          offense: offense,
      });
    } 
  }


  public async setup(client: Discord.Client): Promise<boolean> {
    global.communicationChannel.on("ipc-query", this.ipcQueryHandler.bind(this, client), this.fileName);


    this._loaded = true;
    return true;
  }

  public async unload(client: Discord.Client): Promise<boolean> {
    global.communicationChannel.off("ipc-query", this.ipcQueryHandler.bind(this, client), this.fileName);

    this._loaded = false;
    return true;
  }



  public async runEvent(client: Discord.Client): Promise<void> {
    try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(this._type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(this.fileName)}`, "index.js"); } catch (e) {}


    try {
      const offenses = await storage.find("offense", {});


      if (offenses.length > 0) {
        global.logger.debug(`${offenses.length} offense(s) have been found in the database.`, this.fileName);
        global.logger.debug(`Checking all punishments and updating them if necessary...`, this.fileName);
        performance.start("punishmentControl")
        await punishmentControl(client, offenses);
        const endTime = performance.end("punishmentControl", {silent: !global.app.config.debugging.performances})
        global.logger.debug(`Finished checking all punishments and updating them. (${chalk.yellowBright(endTime)})`, this.fileName);
      }

      new CronJob(
        "0 0 * * *",
        async () => {
          const offenses = await storage.find("offense", {});
          if (offenses.length > 0) {
            global.logger.debug(`Checking all punishments and updating them if necessary...`, this.fileName);
            performance.start("punishmentControl")
            await punishmentControl(client, offenses);
            const endTime = performance.end("punishmentControl", {silent: !global.app.config.debugging.performances})
            global.logger.debug(`Finished checking all punishments and updating them. (${chalk.yellowBright(endTime)})`, this.fileName);
          }
        },
        null,
        true,
      )

    } catch (e) {
      global.logger.error(e, this.fileName);
    }
  }
}