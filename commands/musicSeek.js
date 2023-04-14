const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
  SlashCommandBuilder,
} = require("discord.js");

const { Player, Queue } = require("discord-music-player");

const commandInfo = {
  slashCommand: new SlashCommandBuilder()
    .setName("seek")
    .setDescription("Fast forward the song by x seconds")
    .addNumberOption((option) =>
      option
        .setName("seconds")
        .setDescription("Amount of seconds to skip")
        .setRequired(true)
    ),
};

async function runCommand(interaction, RM) {
  try {
    await interaction.deferReply();
    const player = interaction.client.player;
    let queue = null;
    if (!player.hasQueue(interaction.guild.id)) {
      interaction.followUp({
        content: "There is no music playing",
        ephemeral: false,
      });
    } else {
      queue = player.getQueue(interaction.guild.id);
      seconds = interaction.options.getNumber("seconds");
      await queue.seek(seconds * 1000);
      await interaction.followUp({
        content: `Fast forwarded ${seconds} seconds.`,
        ephemeral: false,
      });
    }
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
}

// returns fuction to index.js
function getSlashCommand() {
  return commandInfo.slashCommand;
}
function getSlashCommandJSON() {
  if (commandInfo.slashCommand.length !== null)
    return commandInfo.slashCommand.toJSON();
  else return null;
}
module.exports = {
  runCommand,
  getSlashCommand,
  getSlashCommandJSON,
};
