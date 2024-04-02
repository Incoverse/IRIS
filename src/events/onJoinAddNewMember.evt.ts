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
import storage from "@src/lib/utilities/storage.js";
import { IRISEventTypes, IRISEvent, IRISEventTypeSettings } from "@src/lib/base/IRISEvent.js";

import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;
export default class OnJoinAddNewMember extends IRISEvent {
  protected _type: IRISEventTypes = "discordEvent";
  protected _typeSettings: IRISEventTypeSettings = {
    listenerKey: Discord.Events.GuildMemberAdd,
  };

  public async runEvent(
  ...args: Array<Discord.GuildMember>
  ): Promise<void> {
    if (args[0].user.bot) return;
    if (args[0].guild.id !== global.app.config.mainServer) return;

    const guild = await args[0].client.guilds.fetch(global.app.config.mainServer);
    let newMembersRole = null;
    await guild.roles.fetch().then(async (roles) => {
      roles.forEach((role) => {
        if (role.name.toLowerCase().includes("new member")) {
          newMembersRole = role;
        }
      });
    });
    if (newMembersRole)
      args[0].roles.add(newMembersRole);
    if (!global.newMembers.includes(args[0].id))
      global.newMembers.push(args[0].id);
    try {
      const entry = {
        ...global.app.config.defaultEntry,
        ...{
          id: args[0].id,
          last_active: new Date().toISOString(),
          username: args[0].user.username,
          isNew: true,
        },
      };
      if (args[0].user.discriminator !== "0" && args[0].user.discriminator)
        entry.discriminator = args[0].user.discriminator;
      await storage.insertOne("user",entry);
      const user = args[0].user.discriminator != "0" && args[0].user.discriminator ? args[0].user.tag: args[0].user.username
      /* prettier-ignore */
      global.logger.debug(`${chalk.yellow(user)} has joined the server. A database entry has been created for them.`, this.fileName)
    } catch (e) {
      global.logger.error(e.toString(), this.fileName);
    }
  }
}