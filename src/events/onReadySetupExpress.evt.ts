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
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import express, { Express, Request, Response } from "express";
import { readFileSync, writeFileSync } from "fs";
import { request } from "undici";
const app: Express = express();
const port = 7380;
const eventInfo = {
  type: "onStart",
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};
let server = null;
let completed = false;
let expires_in = Number.MAX_SAFE_INTEGER
const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
global.communicationChannel.once("authInquiry", async (message) => {
    global.communicationChannel.emit("authInquiryResp", {
        sender: returnFileName(),
        data: {
            authMade: completed,
            ...(completed ? { expires_in } : {})
        }
    })
})
export const setup = async (client:Discord.Client, RM: object) => true
export async function runEvent(client: Discord.Client, RM: object) {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(eventInfo.type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(returnFileName())}`, "index.js"); } catch (e) {}

    
  app.get("/", async ({ query }, response) => {
    const { code } = query;
    const tokenResponseData = await request(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        body: new URLSearchParams({
          client_id: process.env.cID,
          client_secret: process.env.cSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: `http://localhost:7380`,
          scope: "applications.commands.permissions.update",
        }).toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const oauthData: any = await tokenResponseData.body.json();

    // create a function that takes in the .env format and returns an object


    const parsedDotEnv = envToObject(readFileSync(".env", "utf-8"));
    parsedDotEnv["ACCESS_TKN"] = '"' + oauthData.access_token + '"';
    parsedDotEnv["REFRESH_TKN"] = '"' + oauthData.refresh_token + '"';
    process.env.ACCESS_TKN = oauthData.access_token;
    process.env.REFRESH_TKN = oauthData.refresh_token;
    expires_in = oauthData.expires_in
    const newDotEnv = objectToEnv(parsedDotEnv);
    writeFileSync(".env", newDotEnv);
    await response.send("Authorization completed. You can close this window now.");
    completed = true;
    server.close(
        () => global.logger.debug(
            `Express server for oauth2 is no longer listening on port ${chalk.whiteBright(port)}.`, returnFileName())

    );
  });

  if (!process.env.ACCESS_TKN || !process.env.REFRESH_TKN) {
    server = app.listen(port, () => {
        global.logger.debug(`Express server for oauth2 is now running and listening on port ${chalk.whiteBright(port)}.`, returnFileName()
        )
    });
    global.logger.log("Please visit the following link to authorize it so we can set command permissions properly:", returnFileName());
    global.logger.log(chalk.yellowBright(`https://discord.com/oauth2/authorize?client_id=${process.env.cID}&redirect_uri=http://localhost:7380&response_type=code&scope=applications.commands.permissions.update`), returnFileName())
    await waitUntilComplete();
  } else {

    const tokenResponseData = await request(
        "https://discord.com/api/oauth2/token",
        {
            method: "POST",
            body: new URLSearchParams({
                client_id: process.env.cID,
                client_secret: process.env.cSecret,
                grant_type: "refresh_token",
                refresh_token: process.env.REFRESH_TKN,

            }).toString(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );
    if (tokenResponseData.statusCode == 200) {
        const oauthData:any = await tokenResponseData.body.json();
        const parsedDotEnv = envToObject(readFileSync(".env", "utf-8"));
        parsedDotEnv["ACCESS_TKN"] = '"' + oauthData.access_token + '"';
        parsedDotEnv["REFRESH_TKN"] = '"' + oauthData.refresh_token + '"';
        process.env.ACCESS_TKN = oauthData.access_token;
        process.env.REFRESH_TKN = oauthData.refresh_token;
        expires_in = oauthData.expires_in
        const newDotEnv = objectToEnv(parsedDotEnv);
        writeFileSync(".env", newDotEnv);
        completed = true;

    } else {
        global.logger.debug("Credentials in .env were invalid. Starting oauth2 process...", returnFileName())
            // clear
        const parsedDotEnv = envToObject(readFileSync(".env", "utf-8"));
        delete parsedDotEnv["ACCESS_TKN"];
        delete parsedDotEnv["REFRESH_TKN"];
        delete process.env.ACCESS_TKN;
        delete process.env.REFRESH_TKN;
        const newDotEnv = objectToEnv(parsedDotEnv);
        writeFileSync(".env", newDotEnv);
        await runEvent(client, RM)
    }
    }
}
const envToObject = (env: string) => {
    const envArray = env.split("\n");
    const envObject = {};
    envArray.forEach((env) => {
      const [key, value] = env.split("=");
      if (!key||key.trim() == "") return;
      envObject[key] = value;
    });
    return envObject;
  };
  // create a function that does the opposite
  const objectToEnv = (object: object) => {
    let env = "";
    Object.entries(object).forEach(([key, value]) => {

      if (!key||key.trim() == "") return;

      env += `${key}=${value}\n`;
    });
    return env.trim();
  };
function waitUntilComplete() {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (completed) {
        clearInterval(interval);
        global.logger.log("Authorization was successfully completed, resuming boot-up.", returnFileName());
        resolve();
      }
    }, 1000);
  });
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 6;
