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

import { InteractionResponse, Message, REST, SharedSlashCommandOptions, SlashCommandAttachmentOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandIntegerOption, SlashCommandNumberOption, SlashCommandOptionsOnlyBuilder, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption } from "discord.js";
import { EventEmitter } from "events";
import { AppInterface } from "./appInterface.js";

interface IRISGlobal extends NodeJS.Global {
  identifier: any;
  app: AppInterface;
  reload: {
    commands: Array<string>;
  }
  logName: string;
  logger: {
    log: (message: any, sender: string) => Promise<void>;
    error: (message: any, sender: string) => Promise<void>;
    warn: (message: any, sender: string) => Promise<void>;
    debug: (message: any, sender: string) => Promise<void>;
    debugError: (message: any, sender: string) => Promise<void>;
    debugWarn: (message: any, sender: string) => Promise<void>;
  }
  server: {
    main: {
      rules: {
        index: number,
        title: string | null,
        description: string | null,
        punishments: {
          index: number,
          type: string,
          time: string | null,
        }[]
      }[];
      offenses: {
        [key: string]: {
          violation: string,
          punishment_type: string,
          active: boolean,
          violated_at: string,
          ends_at: string | null,
          expires_at: string | null,
          offense_count: number,
        }[]
      }[]
    }
  };

  mongoStatus: number;
  mongoStatuses: {
      RUNNING: number,
      RESTARTING: number,
      STOPPED: number,
      FAILED: number,
      NOT_AVAILABLE: number,
  }
  status: {
    [key: string]: boolean
  }
  overrides: {
    noInteract?: () => Promise<string>;
    interact?: () => Promise<string>;
    reloadCommands?: () => Promise<boolean>;
    removeCommand?: (commandName: string)=> Promise<boolean>;
    updateChoices?: (commandPath: string, option: string, update: (option: any) => Promise<any>) => Promise<boolean>;
    reloadConfig?: () => Promise<boolean>;
    changeConfig?: (key: string, value: any) => Promise<boolean>;
  }
  eventInfo: Map<string, {
    type?: string;
    now?: number;
    timeout?: NodeJS.Timeout;
    listenerFunction?: (...args: any[]) => any;
    listenerKey?: any;
  }>;
  dataForSetup: {
    events: string[]
    commands: string[]
  }
  rest: REST;
  requiredModules: {
    [key: string]: any;
  };
  birthdays: Array<{
    id: string;
    birthday: string;
    timezone: string | null;
    passed?: boolean;
  }>;
  communicationChannel: LoggedEventEmitter;
  newMembers: Array<string>;
  dirName: string;
  SlashCommandBuilder: SlashCommandBuilder;
  mongoConnectionString: string;
  resources: {
    wordle?: {
      validGuesses: Array<string>;
      validWords: Array<string>;
    };
  };
  games: {
    wordle?: {
      word: string;
      id: string;
      expires: string;
      currentlyPlaying: {
        [key: string]: {
          boardMessage: Message | null;
          guesses: Array<string>;
          startTime: number;
          lastEphemeralMessage: InteractionResponse | Message | null;
          timers: {
            gameEndWarning: NodeJS.Timeout | null;
            updateMessageTimer: NodeJS.Timeout | null;
            gameEndTimer: NodeJS.Timeout | null;
          }
        };
      };
    };
    uno?: {
      maxPlayers: number;
    }
  };
}

interface LoggedEventEmitter extends EventEmitter {
  on(event: string | symbol, listener: (...args: any[]) => void, caller?: string): this;
  once(event: string | symbol, listener: (...args: any[]) => void, caller?: string): this;
  emit(event: string | symbol, ...args: any[]): boolean;
  off(event: string | symbol, listener: (...args: any[]) => void, caller?: string): this;
  removeListener(event: string | symbol, listener: (...args: any[]) => void, caller?: string): this;
  addListener(event: string | symbol, listener: (...args: any[]) => void, caller?: string): this;
}