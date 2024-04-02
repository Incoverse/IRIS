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

import { IRISEvent, IRISEventTypeSettings, IRISEventTypes } from "@src/lib/base/IRISEvent.js";
import Discord from "discord.js";
import chalk from "chalk";
import storage from "@src/lib/utilities/storage.js";

import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;
export default class OnLeaveRemoveEntry extends IRISEvent {
  protected _type: IRISEventTypes = "discordEvent";
  protected _typeSettings: IRISEventTypeSettings = {
    listenerKey: Discord.Events.GuildMemberRemove,
  };

  public async runEvent(
  ...args: Array<Discord.GuildMember>
  ): Promise<void> {
    if (args[0].user.bot) return;
    if (args[0].guild.id !== global.app.config.mainServer) return;

    if (global.newMembers.includes(args[0].user.id)) global.newMembers.splice(global.newMembers.indexOf(args[0].user.id),1)
    try {
      await storage.deleteOne("user", { id: args[0].id });
      const user = args[0].user.discriminator != "0" && args[0].user.discriminator ? args[0].user.tag: args[0].user.username
      /* prettier-ignore */
      global.logger.debug(`${chalk.yellow(user)} has left the server. Their entry has been removed from the database.`, this.fileName)
    } catch (e) {
      global.logger.error(`Failed to remove entry for ${chalk.yellow(args[0].user.tag)}: ${e}`, this.fileName)
    }
  }
}