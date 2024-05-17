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
import * as Discord from "discord.js";
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
    member: Discord.GuildMember
  ): Promise<void> {
    if (member.user.bot) return;
    if (member.guild.id !== global.app.config.mainServer) return;
    if (global.newMembers.includes(member.user.id)) global.newMembers.splice(global.newMembers.indexOf(member.user.id),1)
    try {
      await storage.deleteOne("user", { id: member.id });
      const user = member.user.discriminator != "0" && member.user.discriminator ? member.user.tag: member.user.username
      /* prettier-ignore */
      global.logger.debug(`${chalk.yellow(user)} has left the server. Their entry has been removed from the database.`, this.fileName)
    } catch (e) {
      global.logger.error(`Failed to remove entry for ${chalk.yellow(member.user.tag)}: ${e}`, this.fileName)
    }
  }
}