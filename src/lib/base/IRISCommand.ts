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
import path from "path";
import prettyMilliseconds from "pretty-ms";
export type IRISSlashCommand = Discord.SlashCommandBuilder | Discord.SlashCommandSubcommandsOnlyBuilder | Discord.SlashCommandOptionsOnlyBuilder | Omit<Discord.SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup"> | Omit<Discord.SlashCommandSubcommandsOnlyBuilder, "addSubcommand" | "addSubcommandGroup"> | Omit<Discord.SlashCommandOptionsOnlyBuilder, "addSubcommand" | "addSubcommandGroup">;



export abstract class IRISCommand {
    private            _filename: string = "";
    protected          _cacheContainer: Map<Date, any> = new Map();
    protected          _commandSettings: IRISEvCoSettings = {devOnly: false, mainOnly: false}
    protected abstract _slashCommand: IRISSlashCommand;
    
    
    constructor(filename?: string) {
        if (filename) this._filename = filename;
        else {
            //! Find the class caller, get their filename, and set it as the filename
            this._filename = path.basename(new Error().stack.split("\n")[2].replace(/.*file:\/\//, "").replace(/:.*/g, ""))
        }
    }

    public abstract runCommand(interaction: Discord.CommandInteraction): Promise<any>;
    public async autocomplete(interaction: Discord.AutocompleteInteraction): Promise<any> {
        return new Promise<void>(async (res) => res(await interaction.respond([])))
    }

    public get slashCommand() {return this._slashCommand}

    public get commandSettings() {return this._commandSettings}


    public async setup(client: Discord.Client): Promise<boolean> {return true};
    public async unload(client: Discord.Client): Promise<boolean> {return true}

    public get fileName() {
        return this._filename
    }

    public toString() {
        return this.valueOf()
    }
    
    public valueOf() {


        return (
            "C: " +
            this.constructor.name +
            " - " + this._filename
        )
    }

    public get cacheContainer() {
        return this._cacheContainer
    }
    public set cacheContainer(value) {
        this._cacheContainer = value
    }

}

