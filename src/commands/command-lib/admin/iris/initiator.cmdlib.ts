import { IRISSubcommand } from "@src/lib/base/IRISSubcommand.js";
import { Client, SlashCommandBuilder } from "discord.js";

export default class AdminIRISInitiator extends IRISSubcommand {

    static parentCommand: string = "Admin";
    
    public async runSubCommand() {}

    public async setup(parentSlashCommand: SlashCommandBuilder, client: Client): Promise<boolean> {
        
        parentSlashCommand.addSubcommandGroup(subcommandGroup => 
            subcommandGroup
                .setName("iris")
                .setDescription("Commands to manage IRIS")
        )

        this._loaded = true;
        return true;
    }
    
}