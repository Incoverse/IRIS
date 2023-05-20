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

import { InteractionResponse, Message, SlashCommandBuilder } from "discord.js";
import { EventEmitter } from "events";
import { AppInterface } from "./appInterface.js";

interface IRISGlobal extends NodeJS.Global {
  app: AppInterface;
  bannedUsers: Array<string>;
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
  games: {
    wordle?: {
      word: string;
      id: string;
      expires: string;
      currentlyPlaying: {
        [key: string]: {
          boardMessage: Message|null;
          guesses: Array<string>;
          startTime: number;
          lastEphemeralMessage: InteractionResponse|Message|null;
        };
      };
    };
  };
}
