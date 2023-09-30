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
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Interaction,
  InteractionResponse,
  Message,
  MessageComponentInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  Team,
  ThreadChannel,
} from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import UGE, {
  Game,
  Card,
  Deck,
  Config,
  Player,
  Color,
  Value,
} from "uno-game-engine";
import mergeImg from "join-images";
import { MongoClient } from "mongodb";
declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("uno")
    .setDescription("Play UNO with your friends! (max 4)"),
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

export const setup = async (client:Discord.Client, RM: object) => true
export async function runCommand(
  interaction: Discord.CommandInteraction,
  _RM: object
) {
  try {
    const maxPlayers = 4;
    let shouldSaveSettings = false;
    let game;
    let chatThread: null | ThreadChannel = null;
    let settingsMsgs = new Map();
    const drawChoice: {
      [key: string]: number;
    } = {};
    const needsToPickUp: {
      [key: string]: {
        amount: number;
        cardValue: string;
      };
    } = {};
    const nameSubstitutions = {
      ...UGE.constants.values,
      ...{
        WILD_DRAW_FOUR: "DRAW FOUR",
      },
    };
    let settings = {
      crossStacking: false,
      initialCardCount: 7,
      drawTillPlayable: false,
      playAfterDraw: false,
      createThread: true
    };
    const collectors: {
      [key: string]: { [key: string]: Discord.InteractionCollector<any> };
    } = {};
    const interactions: {
      [key: string]: Discord.InteractionResponse;
    } = {};
    const interactionTimers: {
      [key: string]: {
        warn: NodeJS.Timeout;
        close: NodeJS.Timeout;
      };
    } = {};

    let unoCallTable: Array<string> = [];

    let UNOCards = {
      BLANK: "./resources/uno/blank.png",

      // "BLUE"
      BLUE_ZERO: "./resources/uno/blue0.png",
      BLUE_ONE: "./resources/uno/blue1.png",
      BLUE_TWO: "./resources/uno/blue2.png",
      BLUE_THREE: "./resources/uno/blue3.png",
      BLUE_FOUR: "./resources/uno/blue4.png",
      BLUE_FIVE: "./resources/uno/blue5.png",
      BLUE_SIX: "./resources/uno/blue6.png",
      BLUE_SEVEN: "./resources/uno/blue7.png",
      BLUE_EIGHT: "./resources/uno/blue8.png",
      BLUE_NINE: "./resources/uno/blue9.png",
      BLUE_DRAW_TWO: "./resources/uno/bluedrawtwo.png",
      BLUE_REVERSE: "./resources/uno/bluereverse.png",
      BLUE_SKIP: "./resources/uno/blueblock.png",

      //   "GREEN"
      GREEN_ZERO: "./resources/uno/green0.png",
      GREEN_ONE: "./resources/uno/green1.png",
      GREEN_TWO: "./resources/uno/green2.png",
      GREEN_THREE: "./resources/uno/green3.png",
      GREEN_FOUR: "./resources/uno/green4.png",
      GREEN_FIVE: "./resources/uno/green5.png",
      GREEN_SIX: "./resources/uno/green6.png",
      GREEN_SEVEN: "./resources/uno/green7.png",
      GREEN_EIGHT: "./resources/uno/green8.png",
      GREEN_NINE: "./resources/uno/green9.png",
      GREEN_DRAW_TWO: "./resources/uno/greendrawtwo.png",
      GREEN_REVERSE: "./resources/uno/greenreverse.png",
      GREEN_SKIP: "./resources/uno/greenblock.png",

      //   "RED"
      RED_ZERO: "./resources/uno/red0.png",
      RED_ONE: "./resources/uno/red1.png",
      RED_TWO: "./resources/uno/red2.png",
      RED_THREE: "./resources/uno/red3.png",
      RED_FOUR: "./resources/uno/red4.png",
      RED_FIVE: "./resources/uno/red5.png",
      RED_SIX: "./resources/uno/red6.png",
      RED_SEVEN: "./resources/uno/red7.png",
      RED_EIGHT: "./resources/uno/red8.png",
      RED_NINE: "./resources/uno/red9.png",
      RED_DRAW_TWO: "./resources/uno/reddrawtwo.png",
      RED_REVERSE: "./resources/uno/redreverse.png",
      RED_SKIP: "./resources/uno/redblock.png",

      //   "YELLOW"
      YELLOW_ZERO: "./resources/uno/yellow0.png",
      YELLOW_ONE: "./resources/uno/yellow1.png",
      YELLOW_TWO: "./resources/uno/yellow2.png",
      YELLOW_THREE: "./resources/uno/yellow3.png",
      YELLOW_FOUR: "./resources/uno/yellow4.png",
      YELLOW_FIVE: "./resources/uno/yellow5.png",
      YELLOW_SIX: "./resources/uno/yellow6.png",
      YELLOW_SEVEN: "./resources/uno/yellow7.png",
      YELLOW_EIGHT: "./resources/uno/yellow8.png",
      YELLOW_NINE: "./resources/uno/yellow9.png",
      YELLOW_DRAW_TWO: "./resources/uno/yellowdrawtwo.png",
      YELLOW_REVERSE: "./resources/uno/yellowreverse.png",
      YELLOW_SKIP: "./resources/uno/yellowblock.png",

      // "OTHER"
      BLACK_WILD: "./resources/uno/wild.png",
      RED_WILD: "./resources/uno/red_wild.png",
      BLUE_WILD: "./resources/uno/blue_wild.png",
      GREEN_WILD: "./resources/uno/green_wild.png",
      YELLOW_WILD: "./resources/uno/yellow_wild.png",
      BLACK_WILD_DRAW_FOUR: "./resources/uno/draw4.png",
      RED_WILD_DRAW_FOUR: "./resources/uno/red_draw4.png",
      BLUE_WILD_DRAW_FOUR: "./resources/uno/blue_draw4.png",
      GREEN_WILD_DRAW_FOUR: "./resources/uno/green_draw4.png",
      YELLOW_WILD_DRAW_FOUR: "./resources/uno/yellow_draw4.png",
    };

    const start = new ButtonBuilder()
      .setCustomId("start")
      .setLabel("Start Game")
      .setStyle(ButtonStyle.Success);
    const stop = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("Cancel Game")
      .setStyle(ButtonStyle.Danger);
    const settingsBtn = new ButtonBuilder()
      .setCustomId("settings")
      .setLabel("Settings")
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      start,
      stop,
      settingsBtn
    );
    const deleteOnNextTurn = [];
    const players = new Map();
    let mainMessageCollector = null;
    players.set(interaction.user.id, interaction.user);

    try {
      const db = new MongoClient(global.mongoConnectionString);
      const collection = db
        .db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS")
        .collection(
          global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
        );

      collection
        .findOne({
          id: interaction.user.id,
          "gameData.uno.settings": { $exists: true },
        })
        .then((result) => {
          db.close();
          if (result) {
            delete result._id;
            settings = { ...settings, ...result.gameData.uno.settings };
          }
        });
    } catch (e) {}

    const lobbyMessage = await (
      await interaction.reply({
        content: "React with 🚪 to join!\n" + generatePlayerList(),
        components: [row],
      })
    ).fetch();
    await lobbyMessage.react("🚪");
    const queue = new Map();
    let mainMessage: Message = null;
    const collector = lobbyMessage.createReactionCollector({
      filter: (reaction, user) =>
        reaction.emoji.name == "🚪" &&
        user.id != interaction.user.id &&
        user.id != interaction.client.user.id,
      dispose: true,
      time: 14 * 60 * 1000,
    });
    collector.on("end", async (_collected, reason) => {
      if (reason == "time") {
        await lobbyMessage.edit({
          content: "Time-out! Game cancelled.",
          components: [],
        });
        setTimeout(() => {
          lobbyMessage.delete().catch(() => {});
        }, 10000);
        return;
      }
    });
    collector.on("collect", async (_reaction, user) => {
      if (players.size >= maxPlayers) {
        queue.set(user.id, user);
        return;
      }
      players.set(user.id, user);
      await lobbyMessage.edit({
        content: "React with 🚪 to join!\n" + generatePlayerList(),
        components: [row],
      });
    });
    collector.on("remove", async (_reaction, user) => {
      if (queue.has(user.id)) queue.delete(user.id);
      if (players.has(user.id)) players.delete(user.id);
      //if there is a user in the queue, add them to the players list
      if (queue.size > 0) {
        players.set(queue.keys().next().value, queue.values().next().value);
        queue.delete(queue.keys().next().value);
      }
      await lobbyMessage.edit({
        content: "React with 🚪 to join!\n" + generatePlayerList(),
        components: [row],
      });
    });
    const lobbyButtonsCollector = lobbyMessage.createMessageComponentCollector({
      filter: (interaction) =>
        interaction.customId == "start" ||
        interaction.customId == "cancel" ||
        interaction.customId == "settings",
      time: 14.5 * 60 * 1000, // 14.5 minutes
    });
    lobbyButtonsCollector.on("collect", async (buttonInteraction) => {
      if (interaction.user.id != buttonInteraction.user.id && buttonInteraction.customId != "settings") {
        await buttonInteraction.reply({
          content: "Only the game host can " + buttonInteraction.customId + " the game!",
          ephemeral: true,
        });
        return;
      }
      if (buttonInteraction.customId == "start") {
        // start the game
        const startMSG = await startGame(buttonInteraction);
        if (!startMSG) return;
        mainMessage = await startMSG.fetch();
        if (mainMessage.content.includes("Too few players")) return;
        lobbyButtonsCollector.stop();
        collector.stop();
        if (settings.createThread) {
          chatThread = await mainMessage.startThread({
            name: interaction.user.username +"'" + (interaction.user.username.endsWith("s") ? "" : "s") + " UNO Chat Thread",
            autoArchiveDuration: 1440,
          });

          for (let player of players.keys()) {
            await chatThread.members.add(player);
          }

          await chatThread.send({ // send image in ./src/resources/uno/threadInstructions.png
            content: "Players! Welcome to your personal chat thread. This thread allows you to chat with each other while the game is in progress without moving the game message.\n\nTo open up this thread to the side of your screen, please click the blue text below the game message (see image below). May the best player win!",
            files: ["./resources/uno/threadInstructions.png"]
          })
        }


        mainMessageCollector = (await mainMessage.fetch()).createMessageComponentCollector({
          filter: (interaction) =>
            interaction.customId == "showhand" || interaction.customId == "end",
        });
        mainMessageCollector.on("collect", async (intt) => {
          if (intt.customId == "end") {
            if (intt.user.id != interaction.user.id) {
              await intt.reply({
                content: "Only the game host can end the game!",
                ephemeral: true,
              });
              return;
            }

            const msg = await intt.reply({
              content: "Are you sure you want to end the game?",
              ephemeral: true,
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder()
                    .setCustomId("end")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success),
                  new ButtonBuilder()
                    .setCustomId("cancel")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger)
                ),
              ],
            });
            const collector4 = (await msg.fetch()).createMessageComponentCollector({
              filter: (interaction) =>
                interaction.customId == "end" ||
                interaction.customId == "cancel",
              max: 1,
            });
            if (!Object.keys(collectors).includes(intt.user.id))
              collectors[intt.user.id] = {};
            if (Object.keys(collectors[intt.user.id]).includes("endGame"))
              collectors[intt.user.id]["endGame"].stop();
            collectors[intt.user.id]["endGame"] = collector4;
            collector4.on("collect", async (inttt) => {
              if (inttt.customId == "end") {
                await interaction.deleteReply().catch((_e) => {});
                await intt.deleteReply().catch((_e) => {});
                await mainMessage.delete().catch((_e) => {});
                mainMessageCollector.stop();
                for (let interactionIndex of Object.keys(interactions)) {
                  if (
                    interactions[interactionIndex] instanceof
                    Discord.InteractionResponse
                  ) {
                    try {
                      interactions[interactionIndex].delete().catch((_e) => {});
                    } catch (e) {}
                    delete interactions[interactionIndex];
                  }
                }
                // look through all collectors and stop them
                for (let collectorIndex of Object.keys(collectors)) {
                  for (let collectorIndex2 of Object.keys(
                    collectors[collectorIndex]
                  )) {
                    if (
                      collectors[collectorIndex][collectorIndex2] instanceof
                      Discord.InteractionCollector
                    ) {
                      try {
                        collectors[collectorIndex][collectorIndex2].stop();
                      } catch (e) {}
                      delete collectors[collectorIndex][collectorIndex2];
                    }
                  }
                  delete collectors[collectorIndex];
                }
                // interaction timers
                for (let timerIndex of Object.keys(interactionTimers)) {
                  try {
                    clearTimeout(interactionTimers[timerIndex].close);
                    clearTimeout(interactionTimers[timerIndex].warn);
                  } catch (e) {}
                  delete interactionTimers[timerIndex];
                }
                mainMessageCollector.stop();
                if (chatThread) {
                  await chatThread.send({
                    content: "Game ended! This thread will be deleted in 30 seconds.",
                  });
                  setTimeout(() => {
                    chatThread.delete().catch((_e) => {});
                  }, 30000);
                }


                return;
              } else if (inttt.customId == "cancel") {
                intt.deleteReply().catch((_e) => {});
              }
            });
            return;
          }
          if (
            interactions[intt.user.id] instanceof Discord.InteractionResponse
          ) {
            try {
              interactions[intt.user.id].delete();
            } catch (e) {}
            delete interactions[intt.user.id];
          }
          await showHand(intt);
        });
      } else if (buttonInteraction.customId == "cancel") {
        // stop the game
        await lobbyMessage.delete();
        collector.stop();
        lobbyButtonsCollector.stop();
        try {
          await buttonInteraction.reply({
            content: "Game cancelled!",
            ephemeral: true,
          });
        } catch (e) {
          global.logger.error(e, returnFileName());
          return;
        }
        return;
      } else if (buttonInteraction.customId == "settings") {
        await showSettings(buttonInteraction);
      }
    });
    lobbyButtonsCollector.on("end", async (_collected, reason) => {
      if (reason == "time") {
        await lobbyMessage.edit({
          content: "Time-out! Game cancelled.",
          components: [],
        });
        return;
      }
    })
    async function showSettings(
      inter: MessageComponentInteraction,
      Settings: {
        updateInteraction?: boolean;
        toUpdate?: MessageComponentInteraction;
        whatChanged?: string;
      } = {}
    ) {
      const embed = new EmbedBuilder()
        .setTitle("Settings")
        // .setDescription("Select a setting to change")
        .setColor("Default")
        .addFields(
          {
            name: "Initial Hand Size",
            value: settings.initialCardCount.toString(),
            // inline: true,
          },
          {
            name: "Cross Stacking (+4 on +2, +2 on +4)",
            value: settings.crossStacking ? "Yes" : "No",
            // inline: true,
          },
          {
            name: "Draw Until Playable",
            value: settings.drawTillPlayable ? "Yes" : "No",
            // inline: true,
          },
          {
            name: "Create Chat Thread",
            value: settings.createThread ? "Yes" : "No",
            // inline: true,
          }
        );

        //clone embed to "publicEmbed"
        const publicEmbed = EmbedBuilder.from(embed.toJSON())
        publicEmbed.setFooter({
          text: "Only the game host can change the settings | Changes are shown in real-time.",
          // iconURL: "https://i.imgur.com/JzXgiW3.png"
        })
      if (inter.user.id == interaction.user.id) {

        embed.addFields({
          name: "Save Settings",
          value: shouldSaveSettings ? "Yes" : "No",
          // inline: true,
        });
      } else {
        embed.setFooter({
          text: "Only the game host can change the settings | Changes are shown in real-time.",
          // iconURL: "https://i.imgur.com/JzXgiW3.png"
        })
      }
      const data = {
        embeds: [embed],
        components:
          inter.user.id != interaction.user.id
            ? []
            : [
                new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId("settings")
                    .setPlaceholder("Select a setting")
                    .addOptions(
                      new StringSelectMenuOptionBuilder()
                        .setLabel("Initial Hand Size")
                        .setDescription(
                          "The number of cards each player starts with"
                        )
                        .setValue("initialCardCount"),
                      new StringSelectMenuOptionBuilder()
                        .setLabel("Cross Stacking")
                        .setDescription(
                          "Whether +4s can be stacked on +2s and vice versa"
                        )
                        .setValue("crossStacking"),
                      new StringSelectMenuOptionBuilder()
                        .setLabel("Draw Until Playable")
                        .setDescription(
                          "Whether players will draw until they have a playable card"
                        )
                        .setValue("drawTillPlayable"),
                      new StringSelectMenuOptionBuilder()
                        .setLabel("Create Chat Thread")
                        .setDescription(
                          "Whether to create a chat thread for the game"
                        )
                        .setValue("createThread"),
                      new StringSelectMenuOptionBuilder()
                        .setLabel("Save Settings")
                        .setDescription(
                          "Settings will be saved when the game starts"
                        )
                        .setValue("saveSettings")
                    )
                ),
              ],
        ephemeral: true,
      };
      let settingsMsg
      if (Settings.updateInteraction) {
        settingsMsg = await Settings.toUpdate.update(data);
      } else {
        if (settingsMsgs.has(inter.user.id))
          settingsMsgs.get(inter.user.id).delete().catch((_e) => {});
        settingsMsg = await inter.reply(data);
      }
      if (Settings.whatChanged && Settings.whatChanged!= "saveSettings") {
      for (let entry of settingsMsgs.entries()) {
        let user = entry[0];
        let settingsMessage = entry[1];
        if (interaction.user.id == user) continue;
        try {
          settingsMessage.edit({
            embeds: [publicEmbed],
            components: [],
          });
          } catch (e) {
          settingsMsgs.delete(settingsMessage.user.id);
        }
      }}
      settingsMsgs.set(inter.user.id, settingsMsg);
      if (inter.user.id != interaction.user.id) return;
      const collector5 = (await settingsMsg.fetch()).createMessageComponentCollector({
        filter: (interaction) => interaction.customId == "settings",
        max: 1,
      });
      if (!Object.keys(collectors).includes(inter.user.id))
        collectors[inter.user.id] = {};
      if (Object.keys(collectors[inter.user.id]).includes("settings"))
        collectors[inter.user.id]["settings"].stop();
      collectors[inter.user.id]["settings"] = collector5;
      collector5.on("collect", async (intt: StringSelectMenuInteraction) => {
        if (intt.customId == "settings") {
          if (intt.values[0] == "initialCardCount") {
            const choices = new StringSelectMenuBuilder()
              .setCustomId("initialCardCount")
              .setPlaceholder("Select a value");
            const options = [];
            for (let i = 5; i <= 20; i++) {
              const option = new StringSelectMenuOptionBuilder()
                .setLabel(i.toString())
                .setValue(i.toString());
              options.push(option);
            }
            choices.addOptions(...options);
            const initialCardCountMsg = await intt.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle("Initial Card Count")
                  .setDescription(
                    "Select the number of cards each player will start with"
                  )
                  .setColor("Default")
                  .addFields(
                    {
                      name: "Current Value",
                      value: settings.initialCardCount.toString(),
                    }
                    // {
                    //   name: "Minimum Value",
                    //   value: "1",
                    // },
                    // {
                    //   name: "Maximum Value",
                    //   value: "20",
                    // }
                  ),
              ],
              components: [
                new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                  choices
                ),
              ],
            });
            const collector6 =
              (await initialCardCountMsg.fetch()).createMessageComponentCollector({
                filter: (interaction) =>
                  interaction.customId == "initialCardCount",
                max: 1,
              });
            if (!Object.keys(collectors).includes(inter.user.id))
              collectors[inter.user.id] = {};
            if (
              Object.keys(collectors[inter.user.id]).includes(
                "initialCardCount"
              )
            )
              collectors[inter.user.id]["initialCardCount"].stop();
            collectors[inter.user.id]["initialCardCount"] = collector6;
            collector6.on(
              "collect",
              async (inttt: StringSelectMenuInteraction) => {
                if (inttt.customId == "initialCardCount") {
                  settings.initialCardCount = parseInt(inttt.values[0]);
                  await showSettings(inter, {
                    updateInteraction: true,
                    toUpdate: inttt,
                    whatChanged: "initialCardCount"
                  });
                }
              }
            );
          } else if (intt.values[0] == "crossStacking") {
            settings.crossStacking = !settings.crossStacking;
            await showSettings(inter, {
              updateInteraction: true,
              toUpdate: intt,
              whatChanged: "crossStacking"
            });
          } else if (intt.values[0] == "drawTillPlayable") {
            settings.drawTillPlayable = !settings.drawTillPlayable;
            await showSettings(inter, {
              updateInteraction: true,
              toUpdate: intt,
              whatChanged: "drawTillPlayable"
            });
            
          } else if (intt.values[0] == "createThread") {
            settings.createThread = !settings.createThread;
            await showSettings(inter, {
              updateInteraction: true,
              toUpdate: intt,
              whatChanged: "createThread"
            });
          
          } else if (intt.values[0] == "saveSettings") {
            shouldSaveSettings = !shouldSaveSettings;
            await showSettings(inter, {
              updateInteraction: true,
              toUpdate: intt,
              whatChanged: "saveSettings"
            });
          }
        }
      });
    }
    async function showHand(
      inter: MessageComponentInteraction,
      settings: {
        updateInteraction?: boolean;
        toUpdate?: InteractionResponse;
      } = {
        updateInteraction: false,
        toUpdate: null,
      }
    ) {
      if (
        !game.getPlayerByName(
          settings.updateInteraction
            ? settings.toUpdate.interaction.user.id
            : inter.user.id
        )
      ) {
        try {
          await inter.reply({
            content: "You are not in the game!",
            ephemeral: true,
          });
        } catch (e) {
          global.logger.error(e, returnFileName());
          return;
        }
        return;
      }
      if (
        game.getPlayerByName(
          settings.updateInteraction
            ? settings.toUpdate.interaction.user.id
            : inter.user.id
        ).hand.cards.length == 0
      ) {
        try {
          await inter.reply({
            content: "You have no cards!",
            ephemeral: true,
          });
        } catch (e) {
          global.logger.error(e, returnFileName());
          return;
        }
        return;
      }
      let combinedCards;

      if (
        !Object.keys(drawChoice).includes(
          settings.updateInteraction
            ? settings.toUpdate.interaction.user.id
            : inter.user.id
        )
      ) {
        combinedCards = await combineImages(
          10,
          handToImages({
            cards: game
              .getPlayerByName(
                settings.updateInteraction
                  ? settings.toUpdate.interaction.user.id
                  : inter.user.id
              )
              .hand.cards.sort((a: Card, b: Card) => {
                if (a.color.color === b.color.color) {
                  return cardValuetoNumber(a.value.value) <
                    cardValuetoNumber(b.value.value)
                    ? -1
                    : 1;
                } else {
                  return cardToText(a) > cardToText(b) ? 1 : -1;
                }
              }),
          })
        );
      } else {
        let playableCard = game.getPlayerByName(
          settings.updateInteraction
            ? settings.toUpdate.interaction.user.id
            : inter.user.id
        ).hand.cards[0];
        // if (drawnCards.length == 0) {
        combinedCards = await combineImages(1, [cardToImage(playableCard)]);
        // } else {

        //   combinedCards = await combineImages(1, [
        //   await combineImages(
        //     10,
        //     drawnCards.map((c) => cardToImage(c))
        //   ),
        //   UNOCards.BLANK,
        //   cardToImage(playableCard),
        // ]);
        // }
      }

      const attachment = new AttachmentBuilder(combinedCards, {
        name: "hand.png",
      });
      const id = settings.updateInteraction
        ? settings.toUpdate.interaction.user.id
        : inter.user.id;
      let response:
        | Discord.InteractionResponse<boolean>
        | MessageComponentInteraction;
      let toSendData = {
        content: drawChoice[id]
          ? "You drew **" +
            drawChoice[id] +
            "** card" +
            (drawChoice[id] > 1 ? "s" : "") +
            "!"
          : "",
        files: [attachment],
        ephemeral: true,
        components: !game.ended
          ? [
              ...(await generateShowHandButtons(
                settings.updateInteraction ? settings.toUpdate : inter,
                "selectCardColor",
                {
                  packToRows: true,
                }
              )),
            ]
          : [],
      };
      try {
        if (settings?.updateInteraction && settings?.toUpdate) {
          delete toSendData.ephemeral;
          try {
            await settings.toUpdate.edit(toSendData);
          } catch (e) {
            global.logger.error(e, returnFileName());
            return;
          }
          response = settings.toUpdate;
        } else {
          response = await inter.reply(toSendData);
        }
      } catch (e) {
        global.logger.error(e, returnFileName());
        return false;
      }
      if (!settings.updateInteraction) {
        // if (inter instanceof MessageComponentInteraction) {
        if (interactionTimers[inter.user.id]) {
          clearTimeout(interactionTimers[inter.user.id].warn);
          clearTimeout(interactionTimers[inter.user.id].close);
          delete interactionTimers[inter.user.id];
        }

        interactionTimers[inter.user.id] = {
          warn: setTimeout(async () => {
            try {
              interactions[inter.user.id].edit({
                content:
                  "**Heads up!** Your hand is about to be closed in **1 minute** due to Discord's 15 minute time limit on interactions. You can also reset the interaction timer yourself by clicking 'Show Hand' again.\n\nWhen the message gets deleted, please re-open your hand using the 'Show Hand' button to continue playing as normal.\n||.||",
              });
            } catch (e) {
              global.logger.error(e, returnFileName());
            }
          }, 13 * 60 * 1000),
          close: setTimeout(async () => {
            // if (drawChoice[inter.user.id]) {
            //   await DUPKeep(
            //     game.getPlayerByName(inter.user.id),
            //     interactions[inter.user.id],
            //     inter,
            //     true
            //   );
            // }
            try {
              interactions[inter.user.id].delete();
            } catch (e) {
              global.logger.error(e, returnFileName());
            }
            delete interactions[inter.user.id];
            delete interactionTimers[inter.user.id];
          }, 14 * 60 * 1000),
        };
        interactions[inter.user.id] = response;
      }
      // }
      if (
        game.currentPlayer.name ==
        (settings.updateInteraction
          ? settings.toUpdate.interaction.user.id
          : inter.user.id)
      )
        handleShowHandButtons(response, "selectCardColor", {
          originalMessage: settings.updateInteraction
            ? settings.toUpdate.interaction
            : inter,
        });
      return true;
    }
    async function handleShowHandButtons(
      inter: InteractionResponse,
      stage = "selectCardColor",
      data: {
        originalMessage?: MessageComponentInteraction | Interaction;
        card?: Card;
        drawUntilPlayable?: boolean;
      } = {}
    ) {
      let components: any[];
      try {
        components = (await inter.fetch()).components
          .map((a) => a.components)
          .reduce((a, b) => a.concat(b), []);
      } catch (e) {
        // components = (inter as Message).components.map(a=>a.components).reduce((a,b)=>a.concat(b), []);
      }
      if (stage == "selectCardColor") {
        const collector = (await inter.fetch()).createMessageComponentCollector({
          filter: (ddd) =>
            components
              .filter((a) => a.customId != "discarded")
              .map((c) => c.customId)
              .includes(ddd.customId) && game.currentPlayer.name == ddd.user.id,
          max: 1,
        });
        if (!Object.keys(collectors).includes(data.originalMessage.user.id))
          collectors[data.originalMessage.user.id] = {};
        if (
          Object.keys(collectors[data.originalMessage.user.id]).includes(
            "selectCardColor"
          )
        )
          collectors[data.originalMessage.user.id]["selectCardColor"].stop();
        collectors[data.originalMessage.user.id]["selectCardColor"] = collector;

        collector.on("collect", async (int) => {
          const player = game.getPlayerByName(int.user.id);
          if (int.customId == "draw") {
            if (unoCallTable.includes(player.name)) {
              unoCallTable.splice(unoCallTable.indexOf(player.name), 1);
            }
            if (Object.keys(needsToPickUp).includes(player.name)) {
              let amount = needsToPickUp[player.name].amount;
              delete needsToPickUp[player.name];
              game.discardedCards.cards[0].customData = {
                cards: 0,
              };
              await drawCard(player, amount, {
                inter,
                interaction: int,
              });
            } else {
              await drawCard(player, 1, {
                inter,
                interaction: int,
                drawUntilPlayable: settings.drawTillPlayable,
              });
            }
            return;
          } else if (int.customId == "callUno") {
            unoCallTable.push(player.name);
            await int.update({
              content: "UNO will be called out when you place your card.",
              components: [
                ...(await generateShowHandButtons(int, "selectCardColor", {
                  packToRows: true,
                })),
              ],
            });
            handleShowHandButtons(inter, "selectCardColor", {
              originalMessage: data.originalMessage,
            });
            return;
          } else if (int.customId == "catchMissedCall") {
            // previous player
            const previousPlayer = getPreviousPlayer();
            if (!unoCallTable.includes(previousPlayer.name)) {
              game.draw(previousPlayer, 3, false);
              await int.update({
                components: [
                  ...(await generateShowHandButtons(int, "selectCardColor", {
                    packToRows: true,
                  })),
                ],
              });
              if (Object.keys(interactions).includes(previousPlayer.name)) {
                await interactions[previousPlayer.name].edit({
                  content: "Updating...",
                  components: [],
                  files: [],
                });

                showHand(null, {
                  updateInteraction: true,
                  toUpdate: interactions[previousPlayer.name],
                });
              }
              deleteOnNextTurn.push(
                await inter.interaction.channel.send({
                  content: `<@${previousPlayer.name}> failed to call UNO and were caught by <@${player.name}>. They have drawn **3** cards.`,
                  allowedMentions: { parse: [] },
                })
              );
              await mainMessage.edit({
                content:
                  "It's <@" +
                  game.currentPlayer.name +
                  ">" +
                  (players.get(game.currentPlayer.name).username.endsWith("s")
                    ? "'"
                    : "'s") +
                  " turn!\n\n" +
                  (await generateCardCount()) +
                  "\n----------------------------\n" +
                  (await generateOrder()) +
                  "\n\n**" +
                  (players.get(player.name).discriminator !== "0" &&
                  players.get(player.name).discriminator
                    ? players.get(player.name).tag
                    : players.get(player.name).username) +
                  "** caught **" +
                  (players.get(previousPlayer.name).discriminator !== "0" &&
                  players.get(previousPlayer.name).discriminator
                    ? players.get(previousPlayer.name).tag
                    : players.get(previousPlayer.name).username) +
                  "** for not calling UNO and they have drawn **3** cards!",
                files: [cardToImage(game.discardedCards.cards[0])],
                // allowedMentions: { parse: [] },
              });
              handleShowHandButtons(inter, "selectCardColor", {
                originalMessage: data.originalMessage,
              });
              return;
            }
          } else if (int.customId == "keep") {
            await DUPKeep(player, int, inter);
            return;
          } else if (int.customId == "play") {
            const playableCard = player.hand.cards[0];
            if (playableCard.color.color == "BLACK") {
              await int.update({
                components: [
                  ...(await generateShowHandButtons(int, "selectWildColor", {
                    packToRows: true,
                  })),
                ],
              });
              handleShowHandButtons(inter, "selectWildColor", {
                originalMessage: data.originalMessage,
                card: playableCard,
                drawUntilPlayable: settings.drawTillPlayable,
              });
              return;
            }
            await playCard(inter, player, playableCard, {
              drawUntilPlayable: settings.drawTillPlayable,
            });
            delete drawChoice[player.name];
            await int.update({
              content: "Updating...",
              components: [],
              files: [],
            });

            showHand(null, {
              updateInteraction: true,
              toUpdate: interactions[inter.interaction.user.id],
            });
            return;
          }
          const cards = player
            .getPlayableCards(game.discardedCards.cards[0])
            .find(
              (c: { color: { color: string } }) =>
                c.color.color.toLowerCase() == int.customId
            );
          if (cards) {
            try {
              await int.update({
                components: [
                  ...(await generateShowHandButtons(int, "selectCard", {
                    color: int.customId,
                    packToRows: true,
                  })),
                ],
              });
            } catch (e) {
              global.logger.error(e, returnFileName());
              return;
            }
            handleShowHandButtons(inter, "selectCard", {
              originalMessage: data.originalMessage,
            });
          } else {
            try {
              await int.reply({
                content: "You don't have any " + int.customId + " cards!",
                ephemeral: true,
              });
            } catch (e) {
              global.logger.error(e, returnFileName());
              return;
            }
          }
        });
      } else if (stage == "selectCard") {
        const collector = (await inter.fetch()).createMessageComponentCollector({
          filter: (ddd) =>
            components
              .filter((a) => a.customId != "discarded")
              .map((c) => c.customId)
              .includes(ddd.customId) && game.currentPlayer.name == ddd.user.id,
          max: 1,
        });
        if (!Object.keys(collectors).includes(data.originalMessage.user.id))
          collectors[data.originalMessage.user.id] = {};
        if (
          Object.keys(collectors[data.originalMessage.user.id]).includes(
            "selectCard"
          )
        )
          collectors[data.originalMessage.user.id]["selectCard"].stop();
        collectors[data.originalMessage.user.id]["selectCard"] = collector;
        collector.on("collect", async (int) => {
          if (int.customId == "back") {
            await int.update({
              components: [
                ...(await generateShowHandButtons(int, "selectCardColor", {
                  packToRows: true,
                })),
              ],
            });
            handleShowHandButtons(inter, "selectCardColor", {
              originalMessage: data.originalMessage,
            });
            return;
          }
          const color = int.customId.split("_")[0];
          const value = int.customId.split("_").slice(1).join("_");
          const player = game.getPlayerByName(int.user.id);
          const card = player.hand.getCard(color, value);
          if (!card) {
            try {
              await int.reply({
                content: "You don't have that card!",
                ephemeral: true,
              });
            } catch (e) {
              global.logger.error(e, returnFileName());
              return;
            }
            return;
          }
          if (card.color.color == "BLACK") {
            await int.update({
              components: [
                ...(await generateShowHandButtons(int, "selectWildColor", {
                  packToRows: true,
                })),
              ],
            });
            handleShowHandButtons(inter, "selectWildColor", {
              originalMessage: data.originalMessage,
              card: card,
            });
            return;
          }
          await playCard(inter, player, card);
          if (interactions[inter.interaction.user.id]) {
            try {
              if (
                game.getPlayerByName(inter.interaction.user.id).hand.cards
                  .length == 0
              ) {
                await int.update({
                  content: "Congratulations, you won!",
                  components: [],
                  files: [],
                });
              } else {
                await int.update({
                  content: "Updating...",
                  components: [],
                  files: [],
                });

                showHand(null, {
                  updateInteraction: true,
                  toUpdate: interactions[inter.interaction.user.id],
                });
              }
            } catch (e) {
              // global.logger.error(e, returnFileName());
              return;
            }
          }
        });
      } else if (stage == "selectWildColor") {
        const collector = (await inter.fetch()).createMessageComponentCollector({
          filter: (ddd) =>
            components
              .filter((a) => a.customId != "discarded")
              .map((c) => c.customId)
              .includes(ddd.customId) && game.currentPlayer.name == ddd.user.id,
          max: 1,
        });
        if (!Object.keys(collectors).includes(data.originalMessage.user.id))
          collectors[data.originalMessage.user.id] = {};
        if (
          Object.keys(collectors[data.originalMessage.user.id]).includes(
            "selectWildColor"
          )
        )
          collectors[data.originalMessage.user.id]["selectWildColor"].stop();
        collectors[data.originalMessage.user.id]["selectWildColor"] = collector;
        collector.on("collect", async (int) => {
          if (int.customId == "back") {
            if (!data.drawUntilPlayable) {
              await int.update({
                components: [
                  ...(await generateShowHandButtons(int, "selectCard", {
                    color: data.card.color.color.toLowerCase(),
                    packToRows: true,
                  })),
                ],
              });
              handleShowHandButtons(inter, "selectCard", {
                originalMessage: data.originalMessage,
              });
            } else {
              await int.update({
                content: "Updating...",
                components: [],
                files: [],
              });

              showHand(null, {
                updateInteraction: true,
                toUpdate: interactions[inter.interaction.user.id],
              });
            }
            return;
          }
          const player = game.getPlayerByName(int.user.id);
          data.card.wildPickedColor = int.customId;
          await playCard(inter, player, data.card, {
            drawUntilPlayable: data.drawUntilPlayable,
          });
          if (drawChoice[inter.interaction.user.id])
            delete drawChoice[inter.interaction.user.id];
          if (interactions[inter.interaction.user.id]) {
            try {
              await int.update({
                content: "Updating...",
                components: [],
                files: [],
              });

              showHand(null, {
                updateInteraction: true,
                toUpdate: interactions[inter.interaction.user.id],
              });
            } catch (e) {
              // global.logger.error(e, returnFileName());
              return;
            }
          }
        });
      }
    }
    async function drawCard(
      player: Player,
      amount: number,
      settings: {
        inter?: InteractionResponse;
        silent?: boolean;
        interaction?: MessageComponentInteraction;
        drawUntilPlayable?: boolean;
        _drew?: number;
      } = {
        silent: false,
      }
    ) {
      if (game.draw(player, amount, !settings.drawUntilPlayable)) {
        if (settings.drawUntilPlayable) {
          if (!settings._drew) settings._drew = 0;
          settings._drew += 1;
          const drawnCard = player.hand.cards[0];
          if (!drawnCard.isValidOn(game.discardedCards.getTopCard())) {
            await drawCard(player, 1, settings);
            return;
          }
          drawChoice[player.name] = settings._drew;
          // else game.setNextPlayer(false);
        }
        try {
          await settings.interaction.update({
            content: "Updating...",
            components: [],
            files: [],
          });
          showHand(null, {
            updateInteraction: true,
            toUpdate: interactions[player.name],
          });
        } catch (e) {
          // global.logger.error(e, returnFileName());
          // return;
        }
        if (settings.drawUntilPlayable) return;
        // const after = game.getPlayerByName(player.name).hand.toJSON();
        // after.splice(amount);

        // const attachment = new AttachmentBuilder(
        //   await combineImages(
        //     10,
        //     after.map((a) => cardToImage(CustomizedCard.fromJSON(a)))
        //   ),
        //   {
        //     name: "hand.png",
        //   }
        // );
        // await i.reply({
        //   content: "You drew these cards:",
        //   files: [attachment],
        //   ephemeral: true,
        // });
        if (!settings.silent)
          await mainMessage.edit({
            content:
              "It's <@" +
              game.currentPlayer.name +
              ">" +
              (players.get(game.currentPlayer.name).username.endsWith("s")
                ? "'"
                : "'s") +
              " turn!\n\n" +
              (await generateCardCount()) +
              "\n----------------------------\n" +
              (await generateOrder()) +
              "\n\n**" +
              (players.get(player.name).discriminator !== "0" &&
              players.get(player.name).discriminator
                ? players.get(player.name).tag
                : players.get(player.name).username) +
              "** drew **" +
              amount +
              "** card" +
              (amount == 1 ? "" : "s") +
              "!",
            files: [cardToImage(game.discardedCards.cards[0])],
            // allowedMentions: { parse: [] },
          });
      } else {
        console.error("Couldn't draw " + amount + " card(s)!"); // More cards than in deck
        if (
          game.decks
            .map((a: { cards: string | any[] }) => a.cards.length)
            .reduce((a: any, b: any) => a + b, 0) <
          game.players.reduce(
            (
              a: { hand: { cards: string | any[] } },
              b: { hand: { cards: string | any[] } }
            ) => a.hand.cards.length + b.hand.cards.length
          ) +
            amount
        )
          game.decks.push(new Deck().insertDefaultCards()); // Add a new deck
        await drawCard(player, amount, settings);
      }
    }
    async function DUPKeep(player, int, inter, silent = false) {
      game.setNextPlayer();

      await mainMessage.edit({
        content:
          "It's <@" +
          game.currentPlayer.name +
          ">" +
          (players.get(game.currentPlayer.name).username.endsWith("s")
            ? "'"
            : "'s") +
          " turn!\n\n" +
          (await generateCardCount()) +
          "\n----------------------------\n" +
          (await generateOrder()) +
          "\n\n**" +
          (players.get(player.name).discriminator !== "0" &&
          players.get(player.name).discriminator
            ? players.get(player.name).tag
            : players.get(player.name).username) +
          "** drew **" +
          drawChoice[player.name] +
          "** card" +
          (drawChoice[player.name] > 1 ? "s" : "") +
          " and kept " +
          (drawChoice[player.name] > 1 ? "their playable card!" : "it!"),
        files: [cardToImage(game.discardedCards.cards[0])],
        // allowedMentions: { parse: [] },
      });
      delete drawChoice[player.name];
      if (!silent) {
        await int.update({
          content: "Updating...",
          components: [],
          files: [],
        });

        showHand(null, {
          updateInteraction: true,
          toUpdate: interactions[inter.interaction.user.id],
        });
      }
    }
    async function playCard(
      _inter: InteractionResponse,
      player: Player,
      card: Card,
      settings: {
        drawUntilPlayable?: boolean;
      } = {}
    ) {
      if (game.play(player, card)) {
        // await inter.delete();
        if (Object.keys(needsToPickUp).includes(player.name)) {
          delete needsToPickUp[player.name];
        }
        if (game.getPlayerByName(player.name).hand.cards.length == 0) {
          await handleWin(player);
          return true;
        }
        if (unoCallTable.includes(player.name)) {
          deleteOnNextTurn.push(
            await mainMessage.channel.send({
              content: "<@" + player.name + "> called UNO!",
              allowedMentions: { parse: [] },
            })
          );
        }
        await mainMessage.edit({
          content:
            "It's <@" +
            game.currentPlayer.name +
            ">" +
            (players.get(game.currentPlayer.name).username.endsWith("s")
              ? "'"
              : "'s") +
            " turn!\n\n" +
            (await generateCardCount()) +
            "\n----------------------------\n" +
            (await generateOrder()) +
            "\n\n**" +
            (players.get(player.name).discriminator !== "0" &&
            players.get(player.name).discriminator
              ? players.get(player.name).tag
              : players.get(player.name).username) +
            "** " +
            (drawChoice[player.name]
              ? "drew **" +
                drawChoice[player.name] +
                "** card" +
                (drawChoice[player.name] > 1 ? "s" : "") +
                " and played a"
              : "played a") +
            " **" +
            cardToText(card, true) + "**" +
            ((card.value.value == "DRAW_TWO" && card.customData.cards > 2) ||
            (card.value.value == "WILD_DRAW_FOUR" && card.customData.cards > 4)
              ? " (" + card.customData.cards + " cards)"
              : "") +
            "!",
          files: [cardToImage(game.discardedCards.cards[0])],
          // allowedMentions: { parse: [] },
        });
      } else {
        global.logger.debugError(
          "Failed to play card " +
            cardToText(card) +
            " by " +
            (players.get(player.name).discriminator !== "0" &&
            players.get(player.name).discriminator
              ? players.get(player.name).tag
              : players.get(player.name).username) +
            " on a " +
            cardToText(game.discardedCards.cards[0])
        , returnFileName());
      }
    }
    async function generateCardCount() {
      let final = "";
      for (let [key, value] of players) {
        final +=
          "**" +
          (value.discriminator !== "0" && value.discriminator
            ? value.tag
            : value.username) +
          "** has **" +
          game.getPlayerByName(key).hand.cards.length +
          "** card" +
          (game.getPlayerByName(key).hand.cards.length == 1 ? "" : "s") +
          "!\n";
      }
      return final.trim();
    }
    async function generateShowHandButtons(
      inter: MessageComponentInteraction | InteractionResponse,
      stage = "selectCardColor",
      data: {
        color?: string;
        packToRows?: boolean;
      } = {}
    ) {
      const buttons = [];
      const player = game.getPlayerByName(
        inter instanceof MessageComponentInteraction
          ? inter.user.id
          : inter.interaction.user.id
      );
      const allColors = ["BLACK", "BLUE", "GREEN", "RED", "YELLOW"];
      const allCards = player.hand.cards;
      const playableCards = player.getPlayableCards(
        game.discardedCards.cards[0]
      );

      if (stage == "selectCardColor") {
        //add the colors that the player has as cards
        let colors = [];

        const discardedButton = new ButtonBuilder()
          .setCustomId("discarded")
          .setLabel(
            "Discarded Card: " +
              cardToText(game.discardedCards.cards[0], true)
          )
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true);
        const drawButton = new ButtonBuilder()
          .setCustomId("draw")
          .setLabel(
            "Draw" +
              (Object.keys(needsToPickUp).includes(player.name) &&
              game.currentPlayer.name == player.name
                ? " (" + needsToPickUp[player.name].amount + " cards)"
                : "")
          )
          .setStyle(ButtonStyle.Primary)
          .setDisabled(
            game.currentPlayer.name !=
              (inter instanceof MessageComponentInteraction
                ? inter.user.id
                : inter.interaction.user.id)
          );
        const callUnoButton = new ButtonBuilder()
          .setCustomId("callUno")
          .setLabel("Call UNO")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(
            game.currentPlayer.name !=
              (inter instanceof MessageComponentInteraction
                ? inter.user.id
                : inter.interaction.user.id) || // if not the player's turn
              game.currentPlayer.hand.cards.length != 2 || // if the player doesn't have 2 cards left
              game.currentPlayer.getPlayableCards(game.discardedCards.cards[0])
                .length < 1 ||
              unoCallTable.includes(game.currentPlayer.name) // if the player doesn't have any playable cards
            // All of these conditions must be met for the button to not be disabled which means that the player can call UNO
          );
        const catchIncorrectCallButton = new ButtonBuilder()
          .setCustomId("catchMissedCall")
          .setLabel("Catch Missed UNO Call")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(
            game.getPlayerByName(getPreviousPlayer().name).hand.cards.length !=
              1 || // if the player doesn't have 1 card left
              game.currentPlayer.name !=
                (inter instanceof MessageComponentInteraction
                  ? inter.user.id
                  : inter.interaction.user.id) || // if not the player's turn
              unoCallTable.includes(getPreviousPlayer().name)
          );

        if (data.packToRows) {
          buttons.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              ...(Object.keys(drawChoice).includes(player.name)
                ? [discardedButton, callUnoButton]
                : [
                    discardedButton,
                    drawButton,
                    callUnoButton,
                    catchIncorrectCallButton,
                  ])
            )
          );
          buttons.push(new ActionRowBuilder<ButtonBuilder>());
        } else {
          buttons.push(discardedButton);
        }
        if (Object.keys(drawChoice).includes(player.name)) {
          const keep = new ButtonBuilder()
            .setCustomId("keep")
            .setLabel("Keep")
            .setStyle(ButtonStyle.Primary);
          const play = new ButtonBuilder()
            .setCustomId("play")
            .setLabel("Play")
            .setStyle(ButtonStyle.Primary);

          if (data.packToRows) {
            if (buttons[buttons.length - 1].components.length < 5) {
              buttons[buttons.length - 1].addComponents(keep, play);
            } else {
              buttons.push(
                new ActionRowBuilder<ButtonBuilder>().addComponents(keep, play)
              );
            }
          }
        } else {
          if (
            game.currentPlayer.name ==
            (inter instanceof MessageComponentInteraction
              ? inter.user.id
              : inter.interaction.user.id)
          ) {
            if (playableCards.length > 0) {
              for (let i = 0; i < playableCards.length; i++) {
                colors.push(playableCards[i].color.color);
              }
              colors = [...new Set(colors)];
              // .sort((a,b)=>{
              //   return ["BLACK","BLUE","GREEN","RED","YELLOW"].indexOf(a) < ["BLACK","BLUE","GREEN","RED","YELLOW"].indexOf(b) ? -1 : 1
              // })
              for (let i = 0; i < allColors.length; i++) {
                if (colors.includes(allColors[i])) {
                  const cardButton = new ButtonBuilder()
                    .setCustomId(allColors[i].toLowerCase())
                    .setLabel(allColors[i])
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(
                      game.currentPlayer.name !=
                        (inter instanceof MessageComponentInteraction
                          ? inter.user.id
                          : inter.interaction.user.id)
                    );
                  if (data.packToRows) {
                    if (buttons[buttons.length - 1].components.length < 5) {
                      buttons[buttons.length - 1].addComponents(cardButton);
                    } else {
                      buttons.push(
                        new ActionRowBuilder<ButtonBuilder>().addComponents(
                          cardButton
                        )
                      );
                    }
                  } else {
                    buttons.push(cardButton);
                  }
                }
              }
            } else {
              const noPlayableCardsButton = new ButtonBuilder()
                .setCustomId("noPlayableCards")
                .setLabel("No Playable Cards")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true);

              if (data.packToRows) {
                if (buttons[buttons.length - 1].components.length < 5) {
                  buttons[buttons.length - 1].addComponents(
                    noPlayableCardsButton
                  );
                } else {
                  buttons.push(
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                      noPlayableCardsButton
                    )
                  );
                }
              }
            }
          } else {
            const notYourTurnButton = new ButtonBuilder()
              .setCustomId("notYourTurn")
              .setLabel("Not Your Turn")
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true);

            if (data.packToRows) {
              if (buttons[buttons.length - 1].components.length < 5) {
                buttons[buttons.length - 1].addComponents(notYourTurnButton);
              } else {
                buttons.push(
                  new ActionRowBuilder<ButtonBuilder>().addComponents(
                    notYourTurnButton
                  )
                );
              }
            }
          }
        }
      } else if (stage == "selectCard") {
        const discardedButton = new ButtonBuilder()
          .setCustomId("discarded")
          .setLabel(
            "Discarded Card: " +
              cardToText(game.discardedCards.cards[0], true)
          )
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true);
        if (data.packToRows) {
          buttons.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(discardedButton)
          );
          buttons.push(new ActionRowBuilder<ButtonBuilder>());
        } else {
          buttons.push(discardedButton);
        }
        // find all cards with color data.color (to upper case). Add a back button and give buttons for each value of the card that the user has, maximum 5 buttons per row, so you need to make another row if there are more than 5 buttons
        const cards = playableCards.filter(
          (c: { color: { color: string } }) =>
            c.color.color.toLowerCase() == data.color
        );
        const cardValues = cards.map(
          (c: { value: { value: any } }) => c.value.value
        );
        const uniqueCardValues = [...new Set(cardValues)];
        // Add a back button
        const backButton = new ButtonBuilder()
          .setCustomId("back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Secondary);
        if (data.packToRows) {
          if (buttons[buttons.length - 1].components.length < 5) {
            buttons[buttons.length - 1].addComponents(backButton);
          } else {
            buttons.push(
              new ActionRowBuilder<ButtonBuilder>().addComponents(backButton)
            );
          }
        } else {
          buttons.push(backButton);
        }
        for (let i = 0; i < uniqueCardValues.length; i++) {
          const cardValue = uniqueCardValues[i];
          const card = cards.find(
            (c: { value: { value: unknown } }) => c.value.value == cardValue
          );
          const cardButton = new ButtonBuilder()
            .setCustomId(card.color.color + "_" + card.value.value)
            .setLabel(nameSubstitutions[card.value.value])
            .setStyle(ButtonStyle.Primary);

          if (data.packToRows) {
            if (buttons[buttons.length - 1].components.length < 5) {
              buttons[buttons.length - 1].addComponents(cardButton);
            } else {
              buttons.push(
                new ActionRowBuilder<ButtonBuilder>().addComponents(cardButton)
              );
            }
          } else {
            buttons.push(cardButton);
          }
        }
      } else if (stage == "selectWildColor") {
        const colors = ["RED", "BLUE", "GREEN", "YELLOW"];
        const discardedButton = new ButtonBuilder()
          .setCustomId("discarded")
          .setLabel(
            "Discarded Card: " +
              cardToText(game.discardedCards.cards[0], true)
          )
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true);
        if (data.packToRows) {
          buttons.push(
            new ActionRowBuilder<ButtonBuilder>().addComponents(discardedButton)
          );
          buttons.push(new ActionRowBuilder<ButtonBuilder>());
        } else {
          buttons.push(discardedButton);
        }
        // Add a back button
        const backButton = new ButtonBuilder()
          .setCustomId("back")
          .setLabel("Back")
          .setStyle(ButtonStyle.Secondary);
        if (data.packToRows) {
          if (buttons[buttons.length - 1].components.length < 5) {
            buttons[buttons.length - 1].addComponents(backButton);
          } else {
            buttons.push(
              new ActionRowBuilder<ButtonBuilder>().addComponents(backButton)
            );
          }
        } else {
          buttons.push(backButton);
        }
        for (let i = 0; i < colors.length; i++) {
          const color = colors[i];
          const cardButton = new ButtonBuilder()
            .setCustomId(color)
            .setLabel(color)
            .setStyle(ButtonStyle.Primary);

          if (data.packToRows) {
            if (buttons[buttons.length - 1].components.length < 5) {
              buttons[buttons.length - 1].addComponents(cardButton);
            } else {
              buttons.push(
                new ActionRowBuilder<ButtonBuilder>().addComponents(cardButton)
              );
            }
          } else {
            buttons.push(cardButton);
          }
        }
      }

      return buttons;
    }
    async function combineImages(maxX: number, images: string | any[]) {
      const imageArrays = [];
      for (let i = 0; i < images.length; i += maxX) {
        imageArrays.push(images.slice(i, i + maxX));
      }

      const combinedImages = [];
      for (let i = 0; i < imageArrays.length; i++) {
        let combinedCards = await mergeImg.joinImages(imageArrays[i], {
          direction: "horizontal",
          color: { alpha: 0, r: 0, b: 0, g: 0 },
        });
        combinedCards = combinedCards.png(); // Set transparent background
        combinedImages.push(await combinedCards.toBuffer());
      }

      let finalImage = await mergeImg.joinImages(combinedImages, {
        direction: "vertical",
        color: { alpha: 0, r: 0, b: 0, g: 0 },
        align: "center",
      });
      finalImage = finalImage.png(); // Set transparent background
      return await finalImage.toBuffer();
    }

    function cardValuetoNumber(value: string) {
      return [
        "ZERO",
        "ONE",
        "TWO",
        "THREE",
        "FOUR",
        "FIVE",
        "SIX",
        "SEVEN",
        "EIGHT",
        "NINE",
        "SKIP",
        "REVERSE",
        "DRAW_TWO",
        "WILD",
        "WILD_DRAW_FOUR",
      ].indexOf(value);
    }
    async function startGame(buttonInteraction: MessageComponentInteraction) {
      if (players.size == 1) {
        return await buttonInteraction.reply({
          content: "Too few players! (min 2)",
          ephemeral: true,
        });
      }
      try {
        buttonInteraction.message.delete();
      } catch (e) {}
      if (settingsMsgs.size > 0) {
        for (let settingsMsg of settingsMsgs.values()) {
          (settingsMsg as Message).delete().catch(() => {});
        }
      }
      const config = new Config().setInitialCards(settings.initialCardCount);
      config.override.classes.Deck = CustomizedDeck;
      config.override.classes.Player = CustomizedPlayer;
      game = new CustomizedGame(
        Array.from(players.keys()),
        config
        // TODO: Remove
      );
      game.config.override.functions.gameLogic = (
        _player: Player,
        card: Card
      ) => {
        // reverse
        if (card.value.value == UGE.constants.values.REVERSE) {
          if (game.players.length > 2) {
            game.flipDirection();
          } else {
            game.setNextPlayer(true);
          }
          return true;
        }

        // skip
        if (card.value.value == UGE.constants.values.SKIP) {
          game.setNextPlayer(true);
          return true;
        }

        // draw 2
        if (card.value.value == UGE.constants.values.DRAW_TWO) {
          needsToPickUp[game.getNextPlayer().name] = {
            amount: card.customData.cards,
            cardValue: card.value.value,
          };
          // game.draw(game.getNextPlayer(), 2, true, false, true); // Not forcing the player to draw, as they can play a draw 2 card if they have one
          return true;
        }

        // draw 4
        if (card.value.value == UGE.constants.values.WILD_DRAW_FOUR) {
          needsToPickUp[game.getNextPlayer().name] = {
            amount: card.customData.cards,
            cardValue: card.value.value,
          };

          // game.draw(game.getNextPlayer(), 4, true, false, true); // Not forcing the player to draw, as they can play a draw 4 card if they have one
          return true;
        }

        // wild // dos nothing that needs to be done here

        return true;
      };

      game.start();
      game.eventManager.addEvent(
        new UGE.events.PlayerChangeEvent(
          async (
            oldPlayer: { name: string },
            newPlayer: { name: string | number }
          ) => {
            if (
              (game.discardedCards.cards[0].value.value ==
                UGE.constants.values.REVERSE ||
                game.discardedCards.cards[0].value.value ==
                  UGE.constants.values.SKIP) &&
              !game.discardedCards.cards[0].customData.seen &&
              game.players.length == 2
            ) {
              game.discardedCards.cards[0].customData.seen = true;
              return;
            }

            if (
              game.players.some(
                (a: { hand: { cards: number } }) => a.hand.cards == 0
              )
            )
              return;
            unoCallTable = unoCallTable.filter((a) => a == oldPlayer.name);
            deleteOnNextTurn.forEach(async (a) => {
              try {
                await a.delete();
              } catch (error) {}
            });

            if (interactions[newPlayer.name]) {
              try {
                await interactions[newPlayer.name].edit({
                  content: "Updating...",
                  components: [],
                  files: [],
                });

                showHand(null, {
                  updateInteraction: true,
                  toUpdate: interactions[newPlayer.name],
                });
              } catch (error) {}
            }
          }
        )
      );
      if (shouldSaveSettings) {
        const db = new MongoClient(global.mongoConnectionString);
        try {
          const collection = db
            .db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS")
            .collection(
              global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
            );

          await collection
            .updateOne(
              { id: interaction.user.id },
              {
                $set: {
                  "gameData.uno": {
                    settings,
                  },
                },
              }
            )
        } catch (e) {
          global.logger.debugError(e, returnFileName());
        } finally {
          await db.close();
        }
      }
      return await buttonInteraction.channel.send({
        content:
          "It's <@" +
          game.currentPlayer.name +
          ">" +
          (players.get(game.currentPlayer.name).username.endsWith("s")
            ? "'"
            : "'s") +
          " turn!\n\n" +
          (await generateCardCount()) +
          "\n----------------------------\n" +
          (await generateOrder()),
        files: [cardToImage(game.discardedCards.cards[0])],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("showhand")
              .setLabel("Show Hand")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("end")
              .setLabel("End Game")
              .setStyle(ButtonStyle.Danger)
          ),
        ],
        // allowedMentions: { parse: [] },
      });
    }
    async function generateOrder() {
      let order = [];
      let final = "";
      let seperator = " -> ";

      order.push(
        game.players[game.players.indexOf(game.currentPlayer) - 1] ??
          game.players[game.players.length - 1]
      );
      order.push(game.currentPlayer);
      order.push(
        game.players[game.players.indexOf(game.currentPlayer) + 1] ??
          game.players[0]
      );
      if (game.rotation == "CCW") {
        order.reverse();
      }
      for (let player of order) {
        final +=
          (game.currentPlayer.name == player.name ? "**" : "") +
          (players.get(player.name).discriminator !== "0" &&
          players.get(player.name).discriminator
            ? players.get(player.name).tag
            : players.get(player.name).username) +
          (game.currentPlayer.name == player.name ? "**" : "") +
          " " +
          seperator +
          " ";
      }
      return final.substring(0, final.length - seperator.length - 2);
    }
    function handToImages(hand: Deck) {
      let final = [];
      for (let card of hand.cards) {
        final.push(cardToImage(card));
      }
      return final;
    }
    function cardToText(card: Card, pretty=false) {
      if (pretty) {
        let color = card.color.color.toLowerCase();
        let value = card.value.value.toLowerCase();

        if (value == "draw_two")
          value = "DRAW TWO";
        else if (value == "wild_draw_four")
          value = "DRAW FOUR";

        return color.toUpperCase() + " " + value.toUpperCase();

      }
      return card.color.color + "_" + card.value.value;
    }
    function cardToImage(card: Card) {
      return UNOCards[card.color.color + "_" + card.value.value];
    }
    function getPreviousPlayer() {
      let order = [];
      order.push(
        game.players[game.players.indexOf(game.currentPlayer) - 1] ??
          game.players[game.players.length - 1]
      );
      order.push(game.currentPlayer);
      order.push(
        game.players[game.players.indexOf(game.currentPlayer) + 1] ??
          game.players[0]
      );
      if (game.rotation == "CCW") {
        order.reverse();
      }
      return order[0];
    }

    function generatePlayerList(includeBlank = true) {
      let final = "";
      for (let [key, value] of players) {
        final +=
          "- *" +
          (value.discriminator !== "0" && value.discriminator
            ? value.tag
            : value.username) +
          "*" +
          (key == interaction.user.id ? " (**HOST**)" : "") +
          "\n";
      }
      if (includeBlank)
        for (let i = 0; i < maxPlayers - players.size; i++) {
          final += "- *Empty*\n";
        }
      return final.trimEnd();
    }
    async function handleWin(player: Player) {
      let final = "";
      for (let [key, value] of players) {
        final +=
          "- " +
          (value.discriminator !== "0" && value.discriminator
            ? value.tag
            : value.username) +
          " - " +
          game.getPlayerByName(value.id).hand.cards.length +
          " card" +
          (game.getPlayerByName(value.id).hand.cards.length == 1 ? "" : "s") +
          (key == player.name ? " (**WINNER**)" : "") +
          "\n";
      }
      // game.players = [];
      game.ended = true;
      await mainMessage.edit({
        content: "Game Over!\n" + final.trimEnd(),
        files: [cardToImage(game.discardedCards.cards[0])],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("showhand")
              .setLabel("Show Hand")
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId("end")
              .setLabel("End Game")
              .setStyle(ButtonStyle.Danger)
          ),
        ],
      });
      for (let interactionIndex of Object.keys(interactions)) {
        if (interactionIndex == player.name) continue; // Winner's hand gets changed elsewhere
        const interaction = interactions[interactionIndex];
        try {
          await interaction.edit({
            components: [],
          });
        } catch (error) {}
      }
      // look through all collectors and stop them
      for (let collectorIndex of Object.keys(collectors)) {
        for (let collectorIndex2 of Object.keys(
          collectors[collectorIndex]
        )) {
          if (
            collectors[collectorIndex][collectorIndex2] instanceof
            Discord.InteractionCollector
          ) {
            try {
              collectors[collectorIndex][collectorIndex2].stop();
            } catch (e) {}
            delete collectors[collectorIndex][collectorIndex2];
          }
        }
        delete collectors[collectorIndex];
      }
      // interaction timers
      for (let timerIndex of Object.keys(interactionTimers)) {
        try {
          clearTimeout(interactionTimers[timerIndex].close);
          clearTimeout(interactionTimers[timerIndex].warn);
        } catch (e) {}
        delete interactionTimers[timerIndex];
      }
      mainMessageCollector.stop();
      mainMessage.edit({
        components: [],
      }); 
      if (chatThread) {
        await chatThread.send({
          content: "Game ended! This thread will be deleted in 30 seconds.",
        })
        setTimeout(async () => {
            chatThread.delete().catch((_e) => {});
        }, 30000);
      }
      return;
    }
    class CustomizedPlayer extends Player {
      constructor(name: any, id: any) {
        super(name, id);
      }
      getPlayableCards(card: any, toPlay: any) {
        return (this as Player).hand.cards.filter((c) => {
          return c.isValidOn(card, toPlay, this);
        });
      }
    }
    class CustomizedDeck extends Deck {
      constructor() {
        super();
      }
      insertDefaultCards() {
        super.cards = [];
        for (const color in UGE.constants.cardCounts) {
          for (const value in UGE.constants.cardCounts[color]) {
            for (let i = 0; i < UGE.constants.cardCounts[color][value]; i++) {
              super.addCard(
                new CustomizedCard(
                  color,
                  value,
                  color == UGE.constants.colors.BLACK
                )
              );
            }
          }
        }

        super.shuffle();
        return this;
      }
    }
    class CustomizedCard extends Card {
      customData: {
        [key: string]: any;
      };
      constructor(color: string, value: string, isWild: boolean) {
        super(color, value, isWild);
        this.customData = {};
        if (value == "DRAW_TWO")
          this.customData = { ...this.customData, cards: 2 };
        else if (value == "WILD_DRAW_FOUR")
          this.customData = { ...this.customData, cards: 4 };
      }
      static fromJSON(json: {
        color: any;
        value: any;
        wild: boolean;
        wildPickedColor: any;
      }) {
        let card = new CustomizedCard(
          Color.fromJSON(json.color),
          Value.fromJSON(json.value),
          json.wild
        );
        if (json.wildPickedColor)
          (card as Card).wildPickedColor = Color.fromJSON(json.wildPickedColor);
        return card;
      }
      isValidOn(
        card: { color: { color: any }; value: { value: any } },
        toPlay = false,
        player: Player = null
      ) {
        if (typeof card === "undefined") return false;
        // if ((this as Card).wild && card.wild) return false; // wilds can't be played on wilds

        if (player && Object.keys(needsToPickUp).includes(player?.name)) {
          // if this.value.value matches needsToPickUp[player.name].cardValue, return true

          if (settings.crossStacking)
            return ["DRAW_TWO", "WILD_DRAW_FOUR"].includes(
              (this as Card).value.value
            );
          else
            return (
              needsToPickUp[player.name].cardValue == (this as Card).value.value
            );
        }
        if (!toPlay && (this as Card).wild) return true;

        if (
          (this as Card).wild &&
          (this as Card).wildPickedColor?.color != UGE.constants.colors.BLACK
        )
          return true;
        if (
          (this as Card).wild &&
          (this as Card).wildPickedColor?.color == UGE.constants.colors.BLACK
        )
          return false;

        if ((this as Card).color.color == card.color.color) return true;
        if ((this as Card).value.value == card.value.value) return true;

        return false;
      }
    }
    class CustomizedGame extends Game {
      constructor(players: string[], config: Config) {
        super(players, config);
      }

      start() {
        super.start();
      }

      play(player: Player, card: CustomizedCard | Card) {
        // user input validation
        if (!player) throw new Error("No player provided");
        if (!(player instanceof Player))
          throw new Error("Player must be an instance of Player");

        if (!card) throw new Error("No card provided");
        if (!(card instanceof Card || card instanceof CustomizedCard))
          throw new Error("Card must be an instance of Card");
        if (!settings.crossStacking) {
          if (card.value.value == UGE.constants.values.DRAW_TWO) {
            if (
              (this as Game).discardedCards.getTopCard().value.value ==
              UGE.constants.values.DRAW_TWO
            )
              card.customData.cards =
                (this as Game).discardedCards.getTopCard().customData.cards + 2;
          } else if (card.value.value == UGE.constants.values.WILD_DRAW_FOUR) {
            if (
              (this as Game).discardedCards.getTopCard().value.value ==
              UGE.constants.values.WILD_DRAW_FOUR
            )
              card.customData.cards =
                (this as Game).discardedCards.getTopCard().customData.cards + 4;
          }
        } else {
          if (card.value.value == UGE.constants.values.DRAW_TWO) {
            card.customData.cards =
              ((this as Game).discardedCards.getTopCard().customData.cards ??
                0) + 2;
          } else if (card.value.value == UGE.constants.values.WILD_DRAW_FOUR) {
            card.customData.cards =
              ((this as Game).discardedCards.getTopCard().customData.cards ??
                0) + 4;
          }
        }
        if (
          player.hand.cards.includes(card) &&
          player == (this as Game).currentPlayer &&
          card.isValidOn(
            (this as Game).discardedCards.getTopCard(),
            true,
            player
          )
        ) {
          if (card.wild) card.color = card.wildPickedColor;

          if (
            typeof (this as Game).config.override.functions.gameLogic ==
            "function"
          ) {
            (this as Game).config.override.functions.gameLogic(player, card);
          } else super.gameLogic(player, card);

          player.hand.removeCard(card);
          (this as Game).discardedCards.addCard(card);
          (this as Game).eventManager.fireEvent(
            UGE.events.PlayerPlayEvent.fire(player, card, super.getNextPlayer())
          );
          super.setNextPlayer();
          return true;
        } else {
          return false;
        }
      }
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
