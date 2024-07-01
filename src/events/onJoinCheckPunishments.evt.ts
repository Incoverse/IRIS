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
import { IRISEventTypes, IRISEvent, IRISEventTypeSettings } from "@src/lib/base/IRISEvent.js";


import { IRISGlobal } from "@src/interfaces/global.js";
import { punishmentControl } from "@src/lib/utilities/misc.js";
declare const global: IRISGlobal;
export default class onJoinCheckPunishments extends IRISEvent {
  protected _type: IRISEventTypes = "discordEvent";
  protected _typeSettings: IRISEventTypeSettings = {
    listenerKey: Discord.Events.GuildMemberAdd,
  };

  public async runEvent(
    member: Discord.GuildMember
  ): Promise<void> {
    if (member.user.bot) return;
    if (member.guild.id !== global.app.config.mainServer) return;

    const offenses = await storage.find("offense", { user_id: member.id });

    if (offenses.length > 0) {
      punishmentControl(member.client, offenses);
    }
  }
}