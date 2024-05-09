import { IRISSubcommand } from "@src/lib/base/IRISSubcommand.js";
import { SlashCommandBuilder, Client } from "discord.js";

export default class AdminEntryInitiator extends IRISSubcommand {

    static parentCommand: string = "Admin";
    
    public async runSubCommand() {}

    public async setup(parentSlashCommand: SlashCommandBuilder, client: Client): Promise<boolean> {
        
        parentSlashCommand.addSubcommandGroup(subcommandGroup => 
            subcommandGroup
                .setName("entry")
                .setDescription("Commands to manage user's information in the database")
        )

        this._loaded = true;
        return true;
    }
    
}