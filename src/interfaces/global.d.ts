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

import { InteractionResponse, Message, REST, SlashCommandBuilder } from "discord.js";
import { EventEmitter } from "events";
import { AppInterface } from "./appInterface.js";

interface IRISGlobal extends NodeJS.Global {
  app: AppInterface;
  reload: {
    commands: Array<string>;
  }
  logName: string;
  logger: {
    log: (message: any, sender: string) => void;
    error: (message: any, sender: string) => void;
    warn: (message: any, sender: string) => void;
    debug: (message: any, sender: string) => void;
    debugError: (message: any, sender: string) => void;
    debugWarn: (message: any, sender: string) => void;
  }

  bannedUsers: Array<string>;
  mongoStatus: number;
  mongoStatuses: {
      RUNNING: number,
      RESTARTING: number,
      STOPPED: number,
      FAILED: number,
      NOT_AVAILABLE: number,
    }
  overrides: {
    reloadCommands?: () => Promise<boolean>;
    removeCommand?: (commandName: string, guildId: string)=> Promise<boolean>;
    reloadConfig?: () => Promise<boolean>;
    changeConfig?: (key: string, value: any) => Promise<boolean>;
    setMaxUNOPlayers?: (maxPlayers: number) => Promise<boolean>;
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
  communicationChannel: EventEmitter;
  newMembers: Array<string>;
  dirName: string;
  SlashCommandBuilder: SlashCommandBuilder;
  mongoConnectionString: string;
  resources: {
    wordle: {
      validGuesses: Array<string>;
      validWords: Array<string>;
    };
  };
  loggingData: {
    joins: Array<string>;
    leaves: Array<string>;
    messages: number;
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
