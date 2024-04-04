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

export type IRISEventTypes = "discordEvent" | "onStart" | "runEvery"
export type IRISEventTypeSettings = {runImmediately?: boolean, ms?: number, listenerKey?: Discord.Events}

export abstract class IRISEvent {
    protected          _priority: number = 0;
    protected abstract _type: IRISEventTypes;
    protected          _eventSettings: IRISEvCoSettings = {devOnly: false, mainOnly: false}
    protected           _running: boolean = false;
    private            _filename: string = "";
    protected          _cacheContainer: Map<Date, any> = new Map();


    /**
     * @description The specific information required for the event type
     * @type {Object}
     * @param {boolean} runImmediately (runEvery) Whether the event should run immediately
     * @param {number} ms (runEvery) The amount of time in milliseconds to wait before running the event
     * @param {Discord.Events} listenerKey (discordEvent) The listener key for the event
     */
    protected abstract _typeSettings: IRISEventTypeSettings;
    
    
    
    constructor(filename?: string) {
        if (filename) this._filename = filename;
        else {
            //! Find the class caller, get their filename, and set it as the filename
            this._filename = path.basename(new Error().stack.split("\n")[2].replace(/.*file:\/\//, "").replace(/:.*/g, ""))
        }
    }

    public abstract runEvent(...args: any[]): Promise<void>;

    


    public get listenerKey() {
        if (this._type != "discordEvent") throw new Error("listenerKey is only available for discordEvent events");
        if (!this._typeSettings.listenerKey) throw new Error("listenerKey is not defined for this event");
        return this._typeSettings.listenerKey
    }
    public get running() {
        if (this._type != "runEvery") throw new Error("running is only available for runEvery events");
        return this._running
    }
    public get ms() {
        if (this._type != "runEvery") throw new Error("ms is only available for runEvery events");
        if (!this._typeSettings.ms) throw new Error("ms is not defined for this event");
        return this._typeSettings?.ms
    }
    public get runImmediately() {
        if (this._type != "runEvery") throw new Error("runImmediately is only available for runEvery events");
        return this._typeSettings?.runImmediately ?? false
    }
    public get fileName() {
        return this._filename
    }


    public get priority()      {return this._priority};
    public get type()          {return this._type};
    public get eventSettings() {return this._eventSettings}


    public async setup(client: Discord.Client): Promise<boolean> {return true};
    public async unload(client: Discord.Client): Promise<boolean> {return true}

    public get cacheContainer() {
        return this._cacheContainer
    }
    public set cacheContainer(value) {
        this._cacheContainer = value
    }

    public toString() {
        return this.valueOf()
    }
    public valueOf() {

        let message = ""
        switch (this._type) {
            case "onStart":
                message = "onStart"
                break;
            case "runEvery":
                message = "runEvery - " + prettyMilliseconds(this._typeSettings?.ms||0, {compact: true})
                break;
            case "discordEvent":
                message = "discordEvent - " + this.listenerKey
                break;
        }


        return (
            "E: " +
            this.constructor.name +
            " - P" + this._priority +
            " - " + message +
            " - " + this._filename
        )
    }

}

