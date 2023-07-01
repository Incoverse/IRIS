/*
 * Copyright (c) 2023 Inimi | InimicalPart | Incoverse
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
import undici from "undici";
import moment from "moment-timezone";
import chalk from "chalk";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";

const eventInfo = {
  type: "onStart",
  settings: {
    devOnly: false,
    mainOnly: false,
  },
};

const __filename = fileURLToPath(import.meta.url);
declare const global: IRISGlobal;
export async function runEvent(client: Discord.Client, RM: object) {
  let permissions = global.app.config.permissions;

  // clean out other edition permissions
  for (const permission of Object.keys(permissions)) {
    if (global.app.config.development) {
      permissions[permission] = permissions[permission]["development"];
    } else {
      permissions[permission] = permissions[permission]["main"];
    }
  }
  // convert all selectors to ids
  for (const command of Object.keys(permissions)) {
    for (const permission of permissions[command]) {
      // selector should be the first character that identifies the type of selector, and then the id
      // e.g. @123456789012345678
      permissions[command][
        permissions[command].indexOf(permission)
      ].selector = permission.selector.slice(0,1) + await convertSelectorToId(permission.selector);
    }
  }
  permissions = {...permissions}
  // remove all permissions where the command has 2 or more words
  for (const command of Object.keys(permissions)) {
    if (command.split(" ").length > 1) {
      delete permissions[command];
    }
  }


  const allCommands = await (
    await client.guilds.fetch(global.app.config.mainServer)
  ).commands.fetch();
  for (const command of Object.keys(permissions)) {
    if (!allCommands.some((cmd) => cmd.name == command)) {
      global.logger.error(`Invalid command: ${command} | Command could not be found in '${global.app.config.mainServer}'.`, returnFileName());
      continue;
    }
    const commandId = allCommands.find((cmd) => cmd.name == command).id;
    const commandPermissions = permissions[command];
    const currentPerms = await getCurrentPerms(commandId);
    const finalPermissions = [];
    for (const permission of commandPermissions) {
      const permObject = await convertToPermObject(permission);
      if (permObject) finalPermissions.push(permObject);
    }
    const difference = [
      ...getDifference(finalPermissions, currentPerms),
      ...getDifference(currentPerms, finalPermissions),
    ];

    if (JSON.stringify(difference) == "[]") {
      continue;
    }

    try {
      const tokenResponseData = await undici.request(
        "https://discord.com/api/v10/applications/" +
          process.env.cID +
          "/guilds/" +
          global.app.config.mainServer +
          "/commands/" +
          commandId +
          "/permissions",
        {
          method: "PUT",
          body: JSON.stringify({
            permissions: finalPermissions,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.ACCESS_TKN}`,
          },
        }
      );
      if (tokenResponseData.statusCode == 200) {
        global.logger.debug(`Successfully updated permissions for command '${chalk.yellowBright(command)}'.`, returnFileName());
      } else {
        global.logger.debugError(
            `Failed to update permissions for command '${chalk.yellowBright(command)}'.`, returnFileName()
        );
        global.logger.debugError(await tokenResponseData.body.json(), returnFileName());
      }
    } catch (err) {
      global.logger.error(err, returnFileName());
    }
    function getDifference(array1: any[], array2: any[]) {
      return array1.filter((object1) => {
        return !array2.some((object2) => {
          return (
            object1.id === object2.id &&
            object1.type === object2.type &&
            object1.permission === object2.permission
          );
        });
      });
    }
    async function getCurrentPerms(command_id) {
      const tokenResponseData = await undici.request(
        "https://discord.com/api/v10/applications/" +
          process.env.cID +
          "/guilds/" +
          global.app.config.mainServer +
          "/commands/" +
          commandId +
          "/permissions",
        {
          headers: {
            Authorization: `Bearer ` + process.env.ACCESS_TKN,
          },
        }
      );
      return (await tokenResponseData.body.json()).permissions ?? [];
    }
    async function convertToPermObject(customobject: any) {
      let type = null;
      if (customobject.selector.startsWith("&")) type = 1; //"ROLE"
      else if (customobject.selector.startsWith("@")) type = 2; //"USER"
      else if (customobject.selector.startsWith("#")) type = 3; //"CHANNEL"
      else return null;
      return {
        id: await convertSelectorToId(customobject.selector),
        type,
        permission: customobject.canSee,
      };
    }
  }
  async function convertSelectorToId(selector: string) {
    if (selector.startsWith("@")) {
      // is the selector already an id?
      if (selector.match(/!?[0-9]{18}/)) return selector.replace("@", "");
      else {
        global.logger.error(`Invalid selector: ${selector} | Must be a user snowflake.`, returnFileName());
        return null;
      }
    } else if (selector.startsWith("#")) {
      if (selector.match(/!?[0-9]{18}/)) return selector.replace("#", "");
      else {
        if (
          selector.replace("#", "") == "all" ||
          selector.replace("#", "") == "*"
        ) {
          return (BigInt(global.app.config.mainServer) - 1n).toString();
        }
        const server = await client.guilds.fetch(
          global.app.config.mainServer
        );
        const channels = await server.channels.fetch();
        const channel = channels.find(
          (channel) => channel.name == selector.replace("#", "")
        );
        if (channel) {
          return channel.id;
        } else {
          global.logger.error(`Invalid selector: ${selector} | Channel could not be found in '${server.name}'.`, returnFileName());
          return null;
        }
      }
    } else if (selector.startsWith("&")) {
      if (selector.match(/!?[0-9]{18}/)) return selector.replace("&", "");
      else {
        if (selector.replace("&", "") == "everyone") {
          return global.app.config.mainServer;
        }
        const server = await client.guilds.fetch(
          global.app.config.mainServer
        );
        const roles = await server.roles.fetch();
        const role = roles.find(
          (role) => role.name == selector.replace("&", "")
        );
        if (role) {
          return role.id;
        } else {
          global.logger.error(`Invalid selector: ${selector} | Role could not be found in '${server.name}'.`, returnFileName());
          return null;
        }
      }
    } else {
      global.logger.error(`Invalid selector: ${selector} | Must start with '@', '#' or '&'.`, returnFileName());
      return null;
    }
  }
}
export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const eventType = () => eventInfo.type;
export const eventSettings = () => eventInfo.settings;
export const priority = () => 4;
