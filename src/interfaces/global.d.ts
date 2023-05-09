import { SlashCommandBuilder } from "discord.js";
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
}
