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
import { inspect } from "util";

import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;
export default class OnMessageEval extends IRISEvent {
  protected _type: IRISEventTypes = "discordEvent";
  protected _typeSettings: IRISEventTypeSettings = {
    listenerKey: Discord.Events.MessageCreate,
  };

  public async runEvent(message: Discord.Message): Promise<void> {
    if (message.guildId != global.app.config.mainServer) return;
    if (message.content.startsWith(".IRIS-EVAL ")) {
      await message.client.application.fetch();
      if (
        global.app.owners.includes(message.author.id)
      ) {
        const clean = async (text: string) => {
          // If our input is a promise, await it before continuing
          if (text && text.constructor.name == "Promise") text = await text;

          // If the response isn't a string, `util.inspect()`
          // is used to 'stringify' the code in a safe way that
          // won't error out on objects with circular references
          // (like Collections, for example)

          if (typeof text !== "string") text = inspect(text, { depth: 1 });

          // Replace symbols with character code alternatives
          text = text
            .replace(/`/g, "`" + String.fromCharCode(8203))
            .replace(/@/g, "@" + String.fromCharCode(8203));

          text = text.replaceAll(message.client.token, "[REDACTED]");
          if (process.env.DBPASSWD) text = text.replaceAll(process.env.DBPASSWD, "[REDACTED]");
          text = text.replaceAll(process.env.cSecret, "[REDACTED]");
          if (process.env.ACCESS_TKN) text = text.replaceAll(process.env.ACCESS_TKN, "[REDACTED]");
          if (process.env.REFRESH_TKN) text = text.replaceAll(process.env.REFRESH_TKN, "[REDACTED]");

          // Send off the cleaned up result
          return text;
        };

        const startRegex = /```(.*?\n)/;
        const endRegex = /(|\n)```$/;
        const input = message.content
          .replace(".IRIS-EVAL ", "")
          .replace(startRegex, "")
          .replace(endRegex, "");
        let msg = await message.channel.send("Running....");
        let cleaned;
        try {
          // Evaluate (execute) our input
          const evaled = eval("(async()=>{\n"+input+"\n})()");
          // Put our eval result through the function
          // we defined above
          cleaned = await clean(evaled);

          // Reply in the channel with our result
          const parts = cleaned.match(/(.|[\r\n]){1,1990}/g) ?? [];

          msg.edit(`\`\`\`js\n${parts.shift()}\n\`\`\``);
          for (let msg of parts) {
            message.channel.send(`\`\`\`js\n${msg}\n\`\`\``);
          }
        } catch (err) {
          global.logger.error(err, this.fileName);
          // Reply in the channel with our error
          msg.edit(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
        }
      }
    }
  }

  
}