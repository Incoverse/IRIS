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

import Discord, { Collection } from "discord.js";
import { MongoClient } from "mongodb";
import { IRISGlobal } from "@src/interfaces/global.js";
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
export const setup = async (client:Discord.Client, RM: object) => true
export async function runEvent(client: Discord.Client, RM: object) {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); } catch (e) {}
  let wordle = global?.games?.wordle;
  if (!wordle) {
    const dbclient = new MongoClient(global.mongoConnectionString);
    const database = dbclient.db(
      global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS"
    );
    const gamedata = database.collection(
      global.app.config.development
        ? "DEVSRV_SD_" + global.app.config.mainServer
        : "serverdata"
    );
    const games = (await gamedata.findOne({})).games
    const game = games.find(
      (g) => g.type == "wordle"
    );
    dbclient.close();
    if (game) {
      game.data.currentlyPlaying = {};
      wordle = game.data;
      global.games.wordle = wordle;
    }
  }
  // First check if the wordle is expired, and if it is, make a new one
  if (!wordle || new Date(wordle.expires).getTime() < new Date().getTime()) {
    const dbclient = new MongoClient(global.mongoConnectionString);
    const database = dbclient.db(
      global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS"
    );
    const serverdata = database.collection(
      global.app.config.development
        ? "DEVSRV_SD_" + global.app.config.mainServer
        : "serverdata"
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
    };
    global.games.wordle = { ...data, currentlyPlaying: {} };


    const newGames = (await serverdata.findOne({id:global.app.config.mainServer})).games.filter((a) => a.type != "wordle")
    newGames.push({ type: "wordle", data });
    await serverdata.updateOne({
      id: global.app.config.mainServer,
    },{
      $set: {
        games: newGames,
      },
    });
    
    global.logger.debug(`Successfully generated new wordle: ${chalk.green(newWordle)} (Expires: ${chalk.green(moment(new Date(new Date().getTime() + 1000 * 60 * 60 * 24)).format("M/D/y HH:mm:ss"))})`, returnFileName());
    if (!wordle) return dbclient.close();
    const userdata = database.collection(
      global.app.config.development
        ? "DEVSRV_UD_" + global.app.config.mainServer
        : "userdata"
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
    dbclient.close();
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
