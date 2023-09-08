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

interface IRISEvent {
    getListenerKey?: () => any;
    running: boolean;
    eventType: () => string;
    eventSettings: () => {
        devOnly: boolean;
        mainOnly: boolean;
    };
    priority: () => number;
    getMS: () => number;
    runImmediately: () => boolean;
    setup: (client: Discord.Client, RM: object) => boolean;
    runEvent: (message: Discord.Message, RM: object) => Promise<void>;
    runEvent: (interaction: Discord.CommandInteraction, RM: object) => Promise<void>;
    runEvent: (RM: object, ...args: Array<Discord.GuildMember>) => Promise<void>;
    runEvent: (client: Discord.Client, RM: object) => Promise<void>;
    runEvent: (RM: object, ...args: Array<Discord.User>) => Promise<void>;
    returnFileName: () => string;
    
}
