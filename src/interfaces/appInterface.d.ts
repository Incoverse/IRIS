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

import {
  UserResolvable,
  GuildResolvable,
  Presence,
  PresenceStatus,
  ActivityType,
} from "discord.js";
import { ObjectId } from "mongodb";
import { Permissions } from "./permissions";

interface AppInterface {
  version: string;
  owners: Array<string>;
  config: {
    externalOwners: Array<string>;
    showErrors: boolean;
    debugging: boolean;
    skipMongoFailWait: boolean;
    backupStoragePath: string;
    mainServer: string;
    developmentServer: string;
    development: boolean;
    mongoDBServer: string;
    permissions: Permissions;

    defaultEntry: {
      _id?: string | OptionalId<Document> | null;
      id: string;
      discriminator?: string;
      last_active: string | null;
      timezones: Array<string>;
      username: string;
      approximatedTimezone: string | null;
      birthday: string | null;
      birthdayPassed: boolean;
      isNew: boolean;
    };

    resources: {
      wordle: {
        validGuesses: string; // URL to a text file with valid guesses
        validWords: string; // URL to a text file with valid words (answers)
        emojis: { // Emojis used for the wordle game, in the <:name:id> or <a:name:id> format
          blank: {
            empty: string,
            gray: string,
            yellow: string,
            green: string,
          },
          gray: {
            a: string,
            b: string,
            c: string,
            d: string,
            e: string,
            f: string,
            g: string,
            h: string,
            i: string,
            j: string,
            k: string,
            l: string,
            m: string,
            n: string,
            o: string,
            p: string,
            q: string,
            r: string,
            s: string,
            t: string,
            u: string,
            v: string,
            w: string,
            x: string,
            y: string,
            z: string,
          },
          yellow: {
            a: string,
            b: string,
            c: string,
            d: string,
            e: string,
            f: string,
            g: string,
            h: string,
            i: string,
            j: string,
            k: string,
            l: string,
            m: string,
            n: string,
            o: string,
            p: string,
            q: string,
            r: string,
            s: string,
            t: string,
            u: string,
            v: string,
            w: string,
            x: string,
            y: string,
            z: string,
          },
          green: {
            a: string,
            b: string,
            c: string,
            d: string,
            e: string,
            f: string,
            g: string,
            h: string,
            i: string,
            j: string,
            k: string,
            l: string,
            m: string,
            n: string,
            o: string,
            p: string,
            q: string,
            r: string,
            s: string,
            t: string,
            u: string,
            v: string,
            w: string,
            x: string,
            y: string,
            z: string,
          },
        }
      };
    };
  };
}
