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
import storage from "@src/lib/utilities/storage.js";

import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;
export default class OnMessageLastActive extends IRISEvent {
  protected _type: IRISEventTypes = "discordEvent";
  protected _typeSettings: IRISEventTypeSettings = {
    listenerKey: Discord.Events.MessageCreate,
  };

  public async runEvent(message: Discord.Message): Promise<void> {
    if (message.guildId != global.app.config.mainServer) return;
    if (message.author.id == message.client.user.id) return;
    try {
      const query = { id: message.author.id };
      const updateDoc = {
        $set: {
          last_active: new Date().toISOString(),
        },
      };
      await storage.updateOne("user", query, updateDoc);
    } catch (e) {
      global.logger.error(`Failed to update last_active for ${message.author.tag}: ${e}`, this.fileName);
    }
  }
}