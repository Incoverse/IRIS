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

import { MongoClient } from "mongodb";
import Discord from "discord.js";
import { IRISGlobal } from "../interfaces/global.js"
import { fileURLToPath } from "url";

const eventInfo = {
  type: "onMessage",
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export async function runEvent(message: Discord.Message, RM: object) {
  if (message.guildId != global.app.config.mainServer) return;
  if (message.author.id == message.client.user.id) return;
  const client = new MongoClient(global.mongoConnectionString);
  try {
    const database = client.db("IRIS");
    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );
    let a;
    // Query for a movie that has the title 'Back to the Future'
    const query = { id: message.author.id };
    const updateDoc = {
      $set: {
        last_active: new Date().toISOString(),
      },
    };
    await userdata.updateOne(query, updateDoc, {});
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
export const eventType = () => eventInfo.type;
export const priority = () => 0;
