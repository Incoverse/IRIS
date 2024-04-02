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
import { IRISEvent, IRISEventTypeSettings, IRISEventTypes } from "@src/lib/base/IRISEvent.js";
import chalk from "chalk";
import { readFileSync, writeFileSync } from "fs";
import express, { Express, Request, Response } from "express";

import { IRISGlobal } from "@src/interfaces/global.js";
declare const global: IRISGlobal;

const app: Express = express();
const port = 7380;
let server = null;
let completed = false;
let expires_in = Number.MAX_SAFE_INTEGER
export default class OnReadySetupPermsToken extends IRISEvent {
  protected _type: IRISEventTypes = "onStart";
  protected _priority: number = 6;
  protected _typeSettings: IRISEventTypeSettings = {};

  public async runEvent(client: Discord.Client): Promise<void> {
  try {if (!["Client.<anonymous>", "Timeout._onTimeout"].includes((new Error()).stack.split("\n")[2].trim().split(" ")[1])) global.logger.debug(`Running '${chalk.yellowBright(this._type)} (${chalk.redBright.bold("FORCED by \""+(new Error()).stack.split("\n")[2].trim().split(" ")[1]+"\"")})' event: ${chalk.blueBright(this.fileName)}`, "index.js"); } catch (e) {}


  async function refreshToken() {
    const tokenResponseData = await fetch(
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
    if (tokenResponseData.status == 200) {
      const oauthData: any = await tokenResponseData.json();
      const parsedDotEnv = this.envToObject(readFileSync(".env", "utf-8"));
      parsedDotEnv["ACCESS_TKN"] = '"' + oauthData.access_token + '-' + (new Date().getTime() + (oauthData.expires_in * 1000)) + '"';
      parsedDotEnv["REFRESH_TKN"] = '"' + oauthData.refresh_token + '"';
      process.env.ACCESS_TKN = oauthData.access_token;
      process.env.REFRESH_TKN = oauthData.refresh_token;
      expires_in = oauthData.expires_in

      if (refreshTokenInterval) clearInterval(refreshTokenInterval);
      refreshTokenInterval = setInterval(refreshToken, (expires_in - 30) * 1000);

      const newDotEnv = this.objectToEnv(parsedDotEnv);
      writeFileSync(".env", newDotEnv);
    } else {
      global.logger.warn("The token used for controlling command permissions is no longer valid. IRIS will not be able to update command permissions until she is restarted.", this.fileName);
      const parsedDotEnv = this.envToObject(readFileSync(".env", "utf-8"));
      delete parsedDotEnv["ACCESS_TKN"];
      delete parsedDotEnv["REFRESH_TKN"];
      delete process.env.ACCESS_TKN;
      delete process.env.REFRESH_TKN;
      const newDotEnv = this.objectToEnv(parsedDotEnv);
      writeFileSync(".env", newDotEnv);
      clearInterval(refreshTokenInterval);
    }
  }
  

  let authenticatedUser = null;
  let refreshTokenInterval = null;
    
  app.get("/", async ({ query }, response) => {
    const { code } = query;
    const tokenResponseData = await fetch(
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

    const oauthData: any = await tokenResponseData.json();

    // create a function that takes in the .env format and returns an object


    const parsedDotEnv = this.envToObject(readFileSync(".env", "utf-8"));
    parsedDotEnv["ACCESS_TKN"] = '"' + oauthData.access_token + '-' + (new Date().getTime() + (oauthData.expires_in * 1000)) + '"';
    parsedDotEnv["REFRESH_TKN"] = '"' + oauthData.refresh_token + '"';
    process.env.ACCESS_TKN = oauthData.access_token;
    process.env.REFRESH_TKN = oauthData.refresh_token;
    expires_in = oauthData.expires_in
    
    if (refreshTokenInterval) clearInterval(refreshTokenInterval);
    refreshTokenInterval = setInterval(refreshToken, (expires_in - 30) * 1000);

    const newDotEnv = this.objectToEnv(parsedDotEnv);
    writeFileSync(".env", newDotEnv);
    await response.send("Authorization completed. You can close this window now.");
    authenticatedUser = await fetch(
      "https://discord.com/api/v9/oauth2/@me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${oauthData.access_token}`,
        },
      }
    ).then((res) => res.json()).catch(() => null);
    completed = true;

    server.close(() => global.logger.debug(`Express server for oauth2 is no longer listening on port ${chalk.whiteBright(port)}.`, this.fileName));
  });

  if (!process.env.ACCESS_TKN || !process.env.REFRESH_TKN) {
    server = app.listen(port, () => {
        global.logger.debug(`Express server for oauth2 is now running and listening on port ${chalk.whiteBright(port)}.`, this.fileName
        )
    });
    const guild = await client.guilds.fetch(global.app.config.mainServer);
    const owner = await guild.fetchOwner();
    global.logger.log("--------------------", this.fileName)
    global.logger.log("IRIS requires you to grant her access to change her slash command permissions more accurately.", this.fileName)
    global.logger.log(`${chalk.yellow.bold("Note:")} The owner of the server (${chalk.yellowBright(`@${owner.user.username}`)}), or someone very high up in the ranks should authorize this.`, this.fileName)
    global.logger.log(`More information can be found at: ${chalk.blueBright("https://discord.com/developers/docs/interactions/application-commands#permissions")}`, this.fileName)
    global.logger.log("--------------------", this.fileName)
    global.logger.log("Please click the link below to grant IRIS the necessary permissions.", this.fileName)
    global.logger.log(chalk.yellowBright(`https://discord.com/oauth2/authorize?client_id=${process.env.cID}&redirect_uri=http://localhost:7380&response_type=code&scope=applications.commands.permissions.update+identify`), this.fileName)
    await this.waitUntilComplete();
    global.logger.log("--------------------", this.fileName)
    global.logger.log(`Authorization was successfully completed by ${chalk.yellowBright(`@${authenticatedUser.user.username}`)}. Resuming boot-up...`, this.fileName)

  } else {

    let AccessSplit = process.env.ACCESS_TKN.split("-");
    let expiresAt = new Date(parseInt(AccessSplit[AccessSplit.length - 1]));

    if (expiresAt.getTime() - (30 * 1000) > new Date().getTime()) {

      const isTokenValid = await fetch(
        "https://discord.com/api/v9/oauth2/@me",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${AccessSplit.slice(0, AccessSplit.length - 1).join("-")}`,
          },
        }
      ).then((res) => res.status == 200).catch(() => false);



      if (isTokenValid) {
        process.env.ACCESS_TKN = AccessSplit.slice(0, AccessSplit.length - 1).join("-");

        if (refreshTokenInterval) clearInterval(refreshTokenInterval);
        refreshTokenInterval = setInterval(refreshToken, (expiresAt.getTime() - new Date().getTime() - 30 * 1000));
        
        completed = true
      } else global.logger.debug("Token has expired. Trying to refresh...", this.fileName)
    }

    if (!completed) {
      const tokenResponseData = await fetch(
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
      if (tokenResponseData.status == 200) {
          const oauthData:any = await tokenResponseData.json();
          const parsedDotEnv = this.envToObject(readFileSync(".env", "utf-8"));
          parsedDotEnv["ACCESS_TKN"] = '"' + oauthData.access_token + '-' + (new Date().getTime() + (oauthData.expires_in * 1000)) + '"';
          parsedDotEnv["REFRESH_TKN"] = '"' + oauthData.refresh_token + '"';
          process.env.ACCESS_TKN = oauthData.access_token;
          process.env.REFRESH_TKN = oauthData.refresh_token;
          expires_in = oauthData.expires_in

          if (refreshTokenInterval) clearInterval(refreshTokenInterval);
          refreshTokenInterval = setInterval(refreshToken, (expires_in - 30) * 1000);

          const newDotEnv = this.objectToEnv(parsedDotEnv);
          writeFileSync(".env", newDotEnv);


          completed = true;

      } else {
          global.logger.debug("Credentials in .env were invalid. Starting oauth2 process...", this.fileName)
              // clear
          const parsedDotEnv = this.envToObject(readFileSync(".env", "utf-8"));
          delete parsedDotEnv["ACCESS_TKN"];
          delete parsedDotEnv["REFRESH_TKN"];
          delete process.env.ACCESS_TKN;
          delete process.env.REFRESH_TKN;
          const newDotEnv = this.objectToEnv(parsedDotEnv);
          writeFileSync(".env", newDotEnv);
          await this.runEvent(client)
      }
    }
  }
}

  private envToObject(env: string) {
      const envArray = env.split("\n");
      const envObject = {};
      envArray.forEach((env) => {
        const [key, value] = env.split("=");
        if (!key||key.trim() == "") return;
        envObject[key] = value;
      });
      return envObject;
  };

  private objectToEnv(object: object) {
    let env = "";
    Object.entries(object).forEach(([key, value]) => {

      if (!key||key.trim() == "") return;

      env += `${key}=${value}\n`;
    });
    return env.trim();
  };

  private waitUntilComplete() {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (completed) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }
}