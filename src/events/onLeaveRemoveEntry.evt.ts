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

import Discord from "discord.js";
import chalk from "chalk";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import storage from "@src/lib/utilities/storage.js";

const eventInfo = {
  type: "discordEvent",
  listenerkey: Discord.Events.GuildMemberRemove,
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export const setup = async (client:Discord.Client) => true
export async function runEvent(
  ...args: Array<Discord.GuildMember>
) {
  if (args[0].user.bot) return;
  if (args[0].guild.id !== global.app.config.mainServer) return;

  if (global.newMembers.includes(args[0].user.id)) global.newMembers.splice(global.newMembers.indexOf(args[0].user.id),1)
  try {
    await storage.deleteOne("user", { id: args[0].id });
    const user = args[0].user.discriminator != "0" && args[0].user.discriminator ? args[0].user.tag: args[0].user.username
    /* prettier-ignore */
    global.logger.debug(`${chalk.yellow(user)} has left the server. Their entry has been removed from the database.`,returnFileName())
  } catch (e) {
    global.logger.error(`Failed to remove entry for ${chalk.yellow(args[0].user.tag)}: ${e}`,returnFileName())
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 0;
export const getListenerKey = () => eventInfo.listenerkey;
