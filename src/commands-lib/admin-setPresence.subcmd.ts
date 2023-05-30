import Discord, { ActivityType, CommandInteractionOptionResolver, Team } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";

declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);

export async function runSubCommand(interaction: Discord.CommandInteraction, RM: object) {
    if (global.app.config.development) {
        return await interaction.reply({
          content: "Due to safety reasons, this command is disabled in development mode.",
          ephemeral: true
        })
      }
      const text = (interaction.options as CommandInteractionOptionResolver).getString("text", true);
      const type = parseInt((interaction.options as CommandInteractionOptionResolver).getString("type")) ?? global.app.localConfig.presence.type ?? ActivityType.Watching;
      if (text == "null") {
        interaction.client.user.setPresence({
          activities: [],
        });
        global.app.localConfig.presence = {
          text: null,
          type: null
        }
        writeFileSync("./local_config.json", JSON.stringify(global.app.localConfig));
        await interaction.reply({
          content: "Successfully removed the presence!",
          ephemeral: true
        })
        return;
      }
      interaction.client.user.setPresence({
        activities: [
          {
            name: text,
            type: type
          },
        ],
      });
      global.app.localConfig.presence = {
        text: text,
        type: type
      }
      writeFileSync("./local_config.json", JSON.stringify(global.app.localConfig));
      await interaction.reply({
        content: "Successfully set the presence to `"+ActivityType[type]+"` with text `"+text+"`!",
        ephemeral: true
      })
      return;
}

export const returnFileName = () => __filename.split(process.platform == "linux" ? "/" : "\\")[__filename.split(process.platform == "linux" ? "/" : "\\").length - 1];
