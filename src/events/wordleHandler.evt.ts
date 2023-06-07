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

import Discord, { Collection } from "discord.js";
import { MongoClient } from "mongodb";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import uuid4 from "uuid4";
import moment from "moment-timezone";
import chalk from "chalk";

const eventInfo = {
  type: "runEvery",
  ms: 60000,
  runImmediately: true,
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export async function runEvent(client: Discord.Client, RM: object) {
  let wordle = global?.games?.wordle;
  if (!wordle) {
    const dbclient = new MongoClient(global.mongoConnectionString);
    const database = dbclient.db("IRIS");
    const gamedata = database.collection(
      global.app.config.development ? "gamedata_dev" : "gamedata"
    );
    const game = await gamedata.findOne({ type: "wordle" });
    dbclient.close();
    game.data.currentlyPlaying = {};
    wordle = game.data;
    global.games.wordle = wordle;
  }
  // First check if the wordle is expired, and if it is, make a new one
  if (new Date(wordle.expires).getTime() < new Date().getTime()) {
    const dbclient = new MongoClient(global.mongoConnectionString);
    const database = dbclient.db("IRIS");
    const gamedata = database.collection(
      global.app.config.development ? "gamedata_dev" : "gamedata"
    );
    // Generate a new wordle
    const newWordle =
      global.resources.wordle.validWords[
        Math.floor(Math.random() * global.resources.wordle.validWords.length)
      ];
    // Update the database
    const data = {
      word: newWordle,
      expires: new Date(
        new Date().getTime() + 1000 * 60 * 60 * 24
      ).toISOString(),
      id: uuid4(),
      currentlyPlaying: {},
    };
    const oldWordle = wordle;
    global.games.wordle = { ...data };
    delete data.currentlyPlaying;
    await gamedata.updateOne(
      { type: "wordle" },
      {
        $set: {
          data,
        },
      }
    );
    global.app.debugLog(
      chalk.white.bold(
        "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] [" +
          returnFileName() +
          "] "
      ) +
        "Successfully generated new wordle: " +
        chalk.green(newWordle) +
        " (Expires: " +
        chalk.green(
          moment(new Date(new Date().getTime() + 1000 * 60 * 60 * 24)).format(
            "M/D/y HH:mm:ss"
          )
        ) +
        ")"
    );

    const userdata = database.collection(
      global.app.config.development ? "userdata_dev" : "userdata"
    );

    await userdata.updateMany(
      // Reset streak for everyone that didn't solve the previous wordle
      {
        $and: [
          {
            $or: [
              { "gameData.wordle.lastPlayed.id": { $not: { $eq: wordle.id } } },
              {
                $and: [
                  { "gameData.wordle.lastPlayed.id": { $eq: wordle.id } },
                  { "gameData.wordle.lastPlayed.solved": false },
                ],
              },
            ],
          },
          { "gameData.wordle": { $exists: true } },
          { "gameData.wordle.streak": { $gt: 0 } },
        ],
      },
      { $set: { "gameData.wordle.streak": 0 } }
    );
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 0;
export const getMS = () => eventInfo.ms;
export const runImmediately = () => eventInfo.runImmediately;
