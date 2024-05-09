import { IRISSubcommand } from "@src/lib/base/IRISSubcommand.js";
import { SlashCommandBuilder, Client } from "discord.js";

export default class AdminSystemInitiator extends IRISSubcommand {

    static parentCommand: string = "Admin";
    
    public async runSubCommand() {}

    public async setup(parentSlashCommand: SlashCommandBuilder, client: Client): Promise<boolean> {
        
        parentSlashCommand.addSubcommandGroup(subcommandGroup => 
            subcommandGroup
                .setName("system")
                .setDescription("Commands to manage the system")
        )

        this._loaded = true;
        return true;
    }
    
}