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
import { MongoClient } from "mongodb";
import moment from "moment-timezone";
import chalk from "chalk";
import { IRISGlobal } from "@src/interfaces/global.js";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync } from "fs";
import { request } from "undici";
const eventInfo = {
  type: "onStart",
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};
const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
let tokenExpirySec = Number.MAX_SAFE_INTEGER;
export const setup = async (client:Discord.Client, RM: object) => true
export async function runEvent(client: Discord.Client, RM: object) {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); } catch (e) {}
  global.communicationChannel.on("authInquiryResp", async (message) => {
    if (message.data.authMade) tokenExpirySec = message.data.expires_in;

    startTokenTimer();
  });
}

function startTokenTimer() {
  setTimeout(() => {
    refreshDiscordToken(process.env.REFRESH_TKN).then((tokenResponse: any) => {
      saveNewToken(tokenResponse);
      tokenExpirySec = tokenResponse.expires_in;
      startTokenTimer();
    });
  }, (tokenExpirySec - 30) * 1000);
}

function saveNewToken(tokenResponse) {
  // create a function that takes in the .env format and returns an object
  const envToObject = (env: string) => {
    const envArray = env.split("\n");
    const envObject = {};
    envArray.forEach((env) => {
      const [key, value] = env.split("=");
      envObject[key] = value;
    });
    return envObject;
  };
  // create a function that does the opposite
  const objectToEnv = (object: object) => {
    let env = "";
    Object.entries(object).forEach(([key, value]) => {
      env += `${key}=${value}\n`;
    });
    return env.trim();
  };

  const parsedDotEnv = envToObject(readFileSync(".env", "utf-8"));
  parsedDotEnv["ACCESS_TKN"] = '"' + tokenResponse.access_token + '"';
  parsedDotEnv["REFRESH_TKN"] = '"' + tokenResponse.refresh_token + '"';
  process.env.ACCESS_TKN = tokenResponse.access_token;
  process.env.REFRESH_TKN = tokenResponse.refresh_token;
  const newDotEnv = objectToEnv(parsedDotEnv);
  writeFileSync(".env", newDotEnv);
}
async function refreshDiscordToken(r_tkn) {
  const tokenResponseData = await request(
    "https://discord.com/api/oauth2/token",
    {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.cID,
        client_secret: process.env.cSecret,
        grant_type: "refresh_token",
        refresh_token: r_tkn,
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const tokenResponse = await tokenResponseData.body.json();
  global.logger.debug(
      `Discord OAuth2 token successfully refreshed.`, returnFileName()
  );
  return tokenResponse;
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 5;
