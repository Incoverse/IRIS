import { UserResolvable, GuildResolvable } from "discord.js";

interface AppInterface {
  version: string;
  config: {
    externalOwners: Array<string>;
    showErrors: boolean;
    debugging: boolean;
    mainServer: string;
    developmentServer: string;
    development: boolean;
  };
  debugLog: Function;
}
