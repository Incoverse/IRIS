import { IRISSubcommand } from "@src/lib/base/IRISSubcommand.js";
import { SlashCommandBuilder, Client } from "discord.js";

export default class ModOffenseInitiator extends IRISSubcommand {

    static parentCommand: string = "Mod";
    
    public async runSubCommand() {}

    public async setup(parentSlashCommand: SlashCommandBuilder, client: Client): Promise<boolean> {
        if (!global.app.config.appealSystem.website) return false;

        parentSlashCommand.addSubcommandGroup(subcommandGroup => 
            subcommandGroup
              .setName("offense")
              .setDescription("Commands to manage offenses")
          )

        this._loaded = true;
        return true;
    }
    
}