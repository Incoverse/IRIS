/*
 * Copyright (c) 2023 Inimi | InimicalPart | InCo
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
  CommandInteractionOptionResolver,
  EmbedBuilder,
  GuildMember,
  Team,
} from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import prettyMilliseconds from "pretty-ms";
import { MongoClient } from "mongodb";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
  .setName("wordle")
    .setDescription("Play a game of wordle!")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("guess")
        .setDescription("Guess a word.")
        .addStringOption((option) =>
          option
            .setName("word")
            .setDescription("The word to guess.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("board")
        .setDescription("Get the message link to the current board.")
        )
        .addSubcommand((subcommand) =>
        subcommand.setName("start").setDescription("Start a new game.")
        )
        .addSubcommand((subcommand) =>
        subcommand.setName("stats").setDescription("Get your wordle stats.")
        ),
        settings: {
          devOnly: false
        },
};

export async function runCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  try {
    const wordle = global.games.wordle;
    let endTime;
    const emojis = {
      blank: {
        empty: "<:blank:1109487926062100590>",
        gray: "<:gray_blank:1109486366242394215>",
        yellow: "<:yellow_blank:1109486370226962582>",
        green: "<:green_blank:1109486368473743392>",
      },
      gray: {
        a: "<:gray_a:1109422386496950302>",
        b: "<:gray_b:1109422388417937498>",
        c: "<:gray_c:1109422389453914174>",
        d: "<:gray_d:1109422391223926804>",
        e: "<:gray_e:1109422393249759282>",
        f: "<:gray_f:1109422394872975380>",
        g: "<:gray_g:1109422397158862918>",
        h: "<:gray_h:1109422398400376842>",
        i: "<:gray_i:1109422399495077888>",
        j: "<:gray_j:1109422401042788383>",
        k: "<:gray_k:1109423075809832990>",
        l: "<:gray_l:1109423078519349328>",
        m: "<:gray_m:1109422404402425856>",
        n: "<:gray_n:1109423080243220621>",
        o: "<:gray_o:1109423082415865886>",
        p: "<:gray_p:1109422408173113414>",
        q: "<:gray_q:1109423083539939448>",
        r: "<:gray_r:1109422411100729395>",
        s: "<:gray_s:1109423084991172748>",
        t: "<:gray_t:1109423086840852503>",
        u: "<:gray_u:1109422414602981537>",
        v: "<:gray_v:1109423088317243563>",
        w: "<:gray_w:1109423089722347622>",
        x: "<:gray_x:1109423092134055976>",
        y: "<:gray_y:1109422418222649394>",
        z: "<:gray_z:1109423093371375706>",
      },
      yellow: {
        a: "<:yellow_a:1109268250291879978>",
        b: "<:yellow_b:1109268251902488617>",
        c: "<:yellow_c:1109268253961891911>",
        d: "<:yellow_d:1109268255534755920>",
        e: "<:yellow_e:1109268257329909871>",
        f: "<:yellow_f:1109268258936340651>",
        g: "<:yellow_g:1109268260454674523>",
        h: "<:yellow_h:1109268262740561920>",
        i: "<:yellow_i:1109268263961120779>",
        j: "<:yellow_j:1109268265986949201>",
        k: "<:yellow_k:1109268753348296774>",
        l: "<:yellow_l:1109268268201562132>",
        m: "<:yellow_m:1109268754816319670>",
        n: "<:yellow_n:1109268757660053544>",
        o: "<:yellow_o:1109268271905124382>",
        p: "<:yellow_p:1109268758809280562>",
        q: "<:yellow_q:1109268276170719274>",
        r: "<:yellow_r:1109268760763834438>",
        s: "<:yellow_s:1109268280205652040>",
        t: "<:yellow_t:1109268282000801853>",
        u: "<:yellow_u:1109268970080571492>",
        v: "<:yellow_v:1109268762143760414>",
        w: "<:yellow_w:1109268285624688701>",
        x: "<:yellow_x:1109268764412870786>",
        y: "<:yellow_y:1109268291467346000>",
        z: "<:yellow_z:1109268292767596634>",
      },
      green: {
        a: "<:green_a:1109269732793778226>",
        b: "<:green_b:1109269734115004477>",
        c: "<:green_c:1109269736405090365>",
        d: "<:green_d:1109269738271547503>",
        e: "<:green_e:1109269740343541820>",
        f: "<:green_f:1109269741757014096>",
        g: "<:green_g:1109269743040471143>",
        h: "<:green_h:1109269744969846876>",
        i: "<:green_i:1109269746546905218>",
        j: "<:green_j:1109269748933480468>",
        k: "<:green_k:1109269750447624212>",
        l: "<:green_l:1109269963459534849>",
        m: "<:green_m:1109269965229522964>",
        n: "<:green_n:1109269753970827376>",
        o: "<:green_o:1109269967439921312>",
        p: "<:green_p:1109269759222087690>",
        q: "<:green_q:1109269760866271313>",
        r: "<:green_r:1109269968920522752>",
        s: "<:green_s:1109269764318179440>",
        t: "<:green_t:1109421419156213771>",
        u: "<:green_u:1109422081818492948>",
        v: "<:green_v:1109269768168546325>",
        w: "<:green_w:1109422084263788616>",
        x: "<:green_x:1109269773424001215>",
        y: "<:green_y:1109421977401303040>",
        z: "<:green_z:1109421979326500935>",
      },
    };

    if (
      (interaction.options as CommandInteractionOptionResolver).getSubcommand(
        true
      ) == "start"
    ) {
      if (Object.keys(wordle.currentlyPlaying).includes(interaction.user.id)) {
        return await interaction.reply({
          content: "You are already playing a game of Wordle!",
          ephemeral: true,
        });
      }
      const dbclient = new MongoClient(global.mongoConnectionString);
      const userdata = dbclient
        .db("IRIS")
        .collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
      if (
        (await userdata.findOne({ id: interaction.user.id }))?.gameData?.wordle
          ?.lastPlayed?.id == wordle.id
      ) {
        dbclient.close();
        return await interaction.reply({
          content:
            "You have already played the daily wordle! The daily wordle will reset in **" +
            prettyMilliseconds(
              new Date(wordle.expires).getTime() - Date.now()
            ) +
            "**.",
          ephemeral: true,
        });
      }
      await dbclient.close();
      wordle.currentlyPlaying[interaction.user.id] = {
        boardMessage: null,
        guesses: [],
        startTime: Date.now(),
        lastEphemeralMessage: null,
      };
      const message = await interaction.channel.send({
        content:
          "<@" +
          (interaction.member as GuildMember).id +
          ">" +
          ((interaction.member as GuildMember).displayName.endsWith("s")
            ? "'"
            : "'s") +
          " daily wordle game\n" +
          generateBoard(undefined, true, true),
          allowedMentions: { parse: [] },
      });

      wordle.currentlyPlaying[interaction.user.id].boardMessage =
        await message.fetch();
    } else if (
      (interaction.options as CommandInteractionOptionResolver).getSubcommand(
        true
      ) == "board"
    ) {
      if (!Object.keys(wordle.currentlyPlaying).includes(interaction.user.id)) {
        return await interaction.reply({
          content: "You are not playing a game of Wordle!",
          ephemeral: true,
        });
      }

      await interaction.reply({
        content:
          "Your board can be found here: " +
          wordle.currentlyPlaying[interaction.user.id].boardMessage.url,
        ephemeral: true,
      });
    } else if (
      (interaction.options as CommandInteractionOptionResolver).getSubcommand(
        true
      ) == "guess"
    ) {
      if (!Object.keys(wordle.currentlyPlaying).includes(interaction.user.id)) {
        return await interaction.reply({
          content: "You are not playing a game of Wordle!",
          ephemeral: true,
        });
      }
      const guess = (interaction.options as CommandInteractionOptionResolver)
        .getString("word", true)
        .toLowerCase();
      if (guess.length != 5) {
        try {
          global.games.wordle.currentlyPlaying[
            interaction.user.id
          ].lastEphemeralMessage.delete().catch(() => {});
        } catch {}
        const msg = await interaction.reply({
          content: "Your guess must be 5 letters long!",
          ephemeral: true,
        });
        global.games.wordle.currentlyPlaying[
          interaction.user.id
        ].lastEphemeralMessage = msg;
        return;
      }
      if (
        global.games.wordle.currentlyPlaying[
          interaction.user.id
        ].guesses.includes(guess)
      ) {
        try {
          global.games.wordle.currentlyPlaying[
            interaction.user.id
          ].lastEphemeralMessage.delete().catch(()=>{});
        } catch {}
        const msg = await interaction.reply({
          content: "You have already guessed that word!",
          ephemeral: true,
        });
        global.games.wordle.currentlyPlaying[
          interaction.user.id
        ].lastEphemeralMessage = msg;
        return;
      }
      if (
        ![
          ...global.resources.wordle.validWords,
          ...global.resources.wordle.validGuesses,
        ].includes(guess)
      ) {
        try {
          global.games.wordle.currentlyPlaying[
            interaction.user.id
          ].lastEphemeralMessage.delete().catch(()=>{});
        } catch {}
        const msg = await interaction.reply({
          content: "That is not a valid word!",
          ephemeral: true,
        });
        global.games.wordle.currentlyPlaying[
          interaction.user.id
        ].lastEphemeralMessage = msg;
        return;
      }
      global.games.wordle.currentlyPlaying[interaction.user.id].guesses.push(
        guess
      );

      try {
        global.games.wordle.currentlyPlaying[
          interaction.user.id
        ].lastEphemeralMessage.delete().catch(()=>{});
      } catch {}
      if (wordle.word !== guess) {
        if (
          global.games.wordle.currentlyPlaying[interaction.user.id].guesses
            .length == 6
        ) {
          endTime =Date.now() -
          global.games.wordle.currentlyPlaying[interaction.user.id]
            .startTime
          await wordle.currentlyPlaying[interaction.user.id].boardMessage.edit({
            content:
              "**" +
              (interaction.member as GuildMember).displayName +
              "** failed to solve the daily wordle :(" +
              "\n" +
              generateBoard(undefined, true, true),
          });
          await interaction.reply({
            content: "You're out of guesses :(\n" + generateBoard(),
            ephemeral: true,
          });
          await generateStats(true);
          delete global.games.wordle.currentlyPlaying[interaction.user.id];
          return;
        }
        await wordle.currentlyPlaying[interaction.user.id].boardMessage.edit({
          content:
            wordle.currentlyPlaying[interaction.user.id].boardMessage.content
              .replace(/<.*>/gm, "")
              .trim() +
            "\n" +
            generateBoard(undefined, true, true),
        });
        const msg = await interaction.reply({
          content:
            "**" +
            (6 -
              global.games.wordle.currentlyPlaying[interaction.user.id].guesses
                .length) +
            "** guesses remaining!\n" +
            generateBoard(),
          ephemeral: true,
        });
        global.games.wordle.currentlyPlaying[
          interaction.user.id
        ].lastEphemeralMessage = msg;
        return;
      } else {
        endTime =Date.now() -
        global.games.wordle.currentlyPlaying[interaction.user.id]
          .startTime
        await wordle.currentlyPlaying[interaction.user.id].boardMessage.edit({
          content:
            "**" +
            (interaction.member as GuildMember).displayName +
            "**" +
            " solved the word in **" +
            global.games.wordle.currentlyPlaying[interaction.user.id].guesses
              .length +
            " guess" +
            (global.games.wordle.currentlyPlaying[interaction.user.id].guesses
              .length > 1
              ? "es"
              : "") +
            "** | **" +
            prettyMilliseconds(
endTime
            ) +
            "**!\n" +
            generateBoard(undefined, true, true),
        });
        await interaction.reply({
          content:
            "Congratulatons! You guessed the word!\n" +
            generateBoard(undefined, true, false),
          ephemeral: true,
        });
        await generateStats(false);
        delete global.games.wordle.currentlyPlaying[interaction.user.id];
        return;
      }
    } else if (
      (interaction.options as CommandInteractionOptionResolver).getSubcommand(
        true
      ) == "stats"
    ) {
      await interaction.deferReply({
        ephemeral: true,
      });
      //Generate an embed that will contain the following: Games played, games won, longest streak, current streak, average time (average from last12 and then prettify with prettyMilliseconds), average guesses. Add emojis before the name and use fields.
      const client = new MongoClient(global.mongoConnectionString);
      const collection = client
        .db("IRIS")
        .collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
      try {
        // make sure that if the user hasnt played wordle before, it says so
        let userData: any = await collection.findOne({
          id: interaction.user.id,
        });
        client.close();
        if (!userData?.gameData?.wordle) {
          await interaction.editReply({
            content:
              "You have not played wordle before! Try playing a game first!"
          });
          return;
        }
        userData.gameData.wordle = {
          gamesPlayed: userData?.gameData?.wordle?.gamesPlayed ?? 0,
          gamesWon: userData?.gameData?.wordle?.gamesWon ?? 0,
          last12: userData?.gameData?.wordle?.last12 ?? [],
          lastPlayed: userData?.gameData?.wordle?.lastPlayed ?? null,
          longestStreak: userData?.gameData?.wordle?.longestStreak ?? 0,
          streak: userData?.gameData?.wordle?.streak ?? 0,
        };
        let avgTime = 0;
        let avgGuesses = 0;
        for (let i = 0; i < userData.gameData.wordle.last12.length; i++) {
          avgTime += userData.gameData.wordle.last12[i].time;
          avgGuesses += userData.gameData.wordle.last12[i].guesses.length;
        }
        avgTime /= userData.gameData.wordle.last12.length;
        avgGuesses /= userData.gameData.wordle.last12.length;
        let embed = new EmbedBuilder()
          .setTitle("Wordle Stats")
          .setColor("Green")
          .addFields(
            {
              name: ":joystick: Games Played",
              value: userData.gameData.wordle.gamesPlayed.toString(),
              inline: true,
            },
            {
              name: ":hourglass: Average Time",
              value: prettyMilliseconds(avgTime).toString() ?? "N/A",
              inline: true,
            },
            {
              name: ":fire: Current Streak",
              value: userData.gameData.wordle.streak.toString(),
              inline: true,
            },

            {
              name: ":trophy: Games Won",
              value: userData.gameData.wordle.gamesWon.toString(),
              inline: true,
            },

            {
              name: ":question: Average Guesses",
              value: parseFloat(avgGuesses.toFixed(2)).toString() ?? "N/A",
              inline: true,
            },
            {
              name: ":fire: Longest Streak",
              value: userData.gameData.wordle.longestStreak.toString(),
              inline: true,
            }
          );
        await interaction.editReply({
          embeds: [embed],
        });
        return;

        // .set
      } catch (err) {
        console.error(err);
        client.close();
      }
    }

    async function generateStats(failed: boolean) {
      const client = new MongoClient(global.mongoConnectionString);
      const collection = client
        .db("IRIS")
        .collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
      try {
        let userData: any = await collection.findOne({
          id: interaction.user.id,
        });
        userData.gameData.wordle = {
          gamesPlayed: userData?.gameData?.wordle?.gamesPlayed ?? 0,
          gamesWon: userData?.gameData?.wordle?.gamesWon ?? 0,
          last12: userData?.gameData?.wordle?.last12 ?? [],
          lastPlayed: userData?.gameData?.wordle?.lastPlayed ?? null,
          longestStreak: userData?.gameData?.wordle?.longestStreak ?? 0,
          streak: userData?.gameData?.wordle?.streak ?? 0,
        };
        userData.gameData.wordle.last12 = [
          ...userData.gameData.wordle.last12,
          {
            time:
            endTime,
            guesses:
              global.games.wordle.currentlyPlaying[interaction.user.id].guesses,
          },
        ];
        if (userData.gameData.wordle.last12.length > 12) {
          userData.gameData.wordle.last12.shift();
        }
        await collection.updateOne(
          { id: interaction.user.id },
          {
            $set: {
              "gameData.wordle": {
                lastPlayed: {
                  solved: !failed,
                  id: wordle.id,
                },
                streak: failed ? 0 : userData.gameData.wordle.streak + 1,
                longestStreak: failed
                  ? userData.gameData.wordle.longestStreak
                  : userData.gameData.wordle.longestStreak >
                    userData.gameData.wordle.streak + 1
                  ? userData.gameData.wordle.longestStreak
                  : userData.gameData.wordle.streak + 1,
                gamesPlayed: userData.gameData.wordle.gamesPlayed + 1,
                gamesWon: failed
                  ? userData.gameData.wordle.gamesWon
                  : userData.gameData.wordle.gamesWon + 1,
                last12: userData.gameData.wordle.last12,
              },
            },
          }
        );
        // console.log(
        //   await collection.updateOne(
        //     { id: interaction.user.id },
        //     {
        //       $push: {
        //         "gameData.wordle.last12": {
        //           time:
        //             Date.now() -
        //             global.games.wordle.currentlyPlaying[interaction.user.id]
        //               .startTime,
        //           guesses:
        //             global.games.wordle.currentlyPlaying[interaction.user.id]
        //               .guesses,
        //         },
        //       },
        //     }
        //   )
        // );

        // console.log(
        //   await collection.updateOne(
        //     {
        //       id: interaction.user.id,
        //       "gameData.wordle.last12": { $size: 13 },
        //     },
        //     {
        //       $pop: { "gameData.wordle.last12": -1 },
        //     },
        //     {}
        //   )
        // );
        await client.close();
      } catch (e) {
        console.log(e);
      }
    }

    function generateBoard(
      guesssies: string[] = global.games.wordle.currentlyPlaying[
        interaction.user.id
      ].guesses,
      includeEmpty = true,
      cover = false
    ) {
      let emptyRows = 6 - guesssies.length;
      let board = "";
      function howMany(string: string, ltr: string) {
        let a = string.split("");
        let count = 0;
        for (let i = 0; i < a.length; i++) {
          if (a[i] == ltr) {
            count++;
          }
        }
        return count;
      }

      const lettersRemaining = {};
      const noDuplicate = [...new Set(wordle.word.split(""))];
      for (let letter of noDuplicate) {
        lettersRemaining[letter] = howMany(wordle.word, letter);
      }
      for (let guess of guesssies) {
        let lettersRemainingCopy = JSON.parse(JSON.stringify(lettersRemaining));
        // Add the guess to the board. go from left to right when it comes to checking, if that letter is in the right spot, add the letter as green and subtract it from the lettersRemaining object. if it is in the wrong spot, add it as yellow if lettersRemaining[letter] > 0, otherwise add it as gray. If the letter is not in the word, add it as gray. Make you check them in the correct order: green, yellow, gray. That means that you should go through all the letters checking if its green, then go through all of them again for yellow and the same for gray.
        let boardd: string[] | string = ["", "", "", "", ""];
        for (let i = 0; i < guess.length; i++) {
          if (boardd[i] !== "") continue;
          if (guess[i] == wordle.word[i]) {
            boardd[i] = cover ? emojis.blank.green : emojis.green[guess[i]];
            lettersRemainingCopy[guess[i]]--;
          }
        }
        for (let i = 0; i < guess.length; i++) {
          if (boardd[i] !== "") continue;
          if (
            guess[i] != wordle.word[i] &&
            lettersRemainingCopy[guess[i]] > 0
          ) {
            boardd[i] = cover ? emojis.blank.yellow : emojis.yellow[guess[i]];
            lettersRemainingCopy[guess[i]]--;
          }
        }
        for (let i = 0; i < guess.length; i++) {
          if (boardd[i] !== "") continue;
          if (
            guess[i] != wordle.word[i] &&
            lettersRemainingCopy[guess[i]] == 0
          ) {
            boardd[i] = cover ? emojis.blank.gray : emojis.gray[guess[i]];
          }
        }
        for (let i = 0; i < guess.length; i++) {
          if (boardd[i] !== "") continue;
          if (!wordle.word.split("").includes(guess[i])) {
            boardd[i] = cover ? emojis.blank.gray : emojis.gray[guess[i]];
          }
        }
        board += boardd.join("");
        board += "\n";
      }
      if (includeEmpty) {
        for (let i = 0; i < emptyRows; i++) {
          board +=
            emojis.blank.empty +
            emojis.blank.empty +
            emojis.blank.empty +
            emojis.blank.empty +
            emojis.blank.empty +
            "\n";
        }
        board = board.trimEnd();
      }

      return board;
    }
  } catch (e) {
    console.error(e);
    await interaction.client.application.fetch();
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
