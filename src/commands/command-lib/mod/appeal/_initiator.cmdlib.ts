import { IRISGlobal } from "@src/interfaces/global.js";
import { IRISSubcommand } from "@src/lib/base/IRISSubcommand.js";
import { SlashCommandBuilder, Client } from "discord.js";

declare const global: IRISGlobal

export default class ModAppealInitiator extends IRISSubcommand {

    static parentCommand: string = "Mod";
    
    public async runSubCommand() {}

    public async setup(parentSlashCommand: SlashCommandBuilder, client: Client): Promise<boolean> {
        if (!global.app.config.appealSystem.website) return false;

        parentSlashCommand.addSubcommandGroup(subcommandGroup => 
            subcommandGroup
              .setName("appeal")
              .setDescription("Commands to manage appeals")
          )

        this._loaded = true;
        return true;
    }
    
}