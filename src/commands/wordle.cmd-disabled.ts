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

import Discord, { Team } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("wordle")
    .setDescription("Wordle demo."),
};

export async function runCommand(interaction: Discord.CommandInteraction, RM: object) {
  try {
    const emojis = {
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

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const getSlashCommand = () => commandInfo.slashCommand;
export const commandCategory = () => commandInfo.category;