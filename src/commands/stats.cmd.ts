import Discord, { Team } from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import { PathLike, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";

import prettyMilliseconds from "pretty-ms";
declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
    .setName("stats")
    .setDescription("Get IRIS' statistics!"),
};

export async function runCommand(
  interaction: Discord.CommandInteraction,
  RM: object
) {
  try {
    const getAllFiles = function(dirPath: PathLike, arrayOfFiles: string[]) {
    const files = readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []

  files.forEach(function(file) {
    if (statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(join(dirPath.toString(), "/", file))
    }
  })

  return arrayOfFiles
}

    let totalLines: number = 0;
    let totalCharacters: number = 0;
    const finalEmbed: Discord.EmbedBuilder = new Discord.EmbedBuilder()
      .setTitle("IRIS' Statistics")
      .setColor("Random");


      const files: Array<string> = getAllFiles(join(__dirname, "..", "..", "src"), []).filter(f=>f.endsWith(".ts"))
    for (let path of files) {
      // Read all files, and get the line count, and add it to the total
      totalLines += readFileSync(path).toString().split("\n").length;
      // Read all files, and get the character count, and add it to the total
      totalCharacters += readFileSync(path).toString().length;
    }
    finalEmbed.addFields(
      {
        name: ":robot: Uptime",
        value: prettyMilliseconds(
          new Date().getTime() - interaction.client.readyTimestamp
        ).toString(),
        inline: true,
      },
      {
        name: ":alarm_clock: Events",
        value: Object.keys(RM)
          .filter((evt) => evt.startsWith("event"))
          .length.toString(),
        inline: true,
      },

      {
        name: ":scroll: Total Lines",
        value: totalLines.toString(), // +" lines",
        inline: true,
      },
      {
        name: ":ping_pong: Ping",
        value: interaction.client.ws.ping.toString() + "ms",
        inline: true,
      },
      {
        name: ":jigsaw: Commands",
        value: Object.keys(RM)
          .filter((cmd) => cmd.startsWith("cmd"))
          .length.toString(),
        inline: true,
      },
      {
        name: ":memo: Total Characters",
        value: totalCharacters.toString(), // +" chars",
        inline: true,
      }
    );
    await interaction.reply({
      embeds: [finalEmbed],
      ephemeral: true,
    });
  } catch (e) {
    console.error(e);
    await interaction.client.application.fetch();
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true
            ? "\n\n``" +
              ([
                ...Array.from(
                  (interaction.client.application.owner as Team).members.keys()
                ),
                ...global.app.config.externalOwners,
              ].includes(interaction.user.id)
                ? e.stack.toString()
                : e.toString()) +
              "``"
            : ""),
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "⚠️ There was an error while executing this command!" +
          (global.app.config.showErrors == true
            ? "\n\n``" +
              ([
                ...Array.from(
                  (interaction.client.application.owner as Team).members.keys()
                ),
                ...global.app.config.externalOwners,
              ].includes(interaction.user.id)
                ? e.stack.toString()
                : e.toString()) +
              "``"
            : ""),
        ephemeral: true,
      });
    }
  }
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const getSlashCommand = () => commandInfo.slashCommand;
export const commandCategory = () => commandInfo.category;

