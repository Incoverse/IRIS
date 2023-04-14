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
    .setName("queuelist")
    .setDescription("Lists songs in the queue"),
};

async function runCommand(interaction, RM) {
  try {
    await interaction.deferReply();
    const player = interaction.client.player;
    let queue = null;
    if (!player.hasQueue(interaction.guild.id)) {
      interaction.followUp({
        content: "Queue is empty! Start listening with /queuesong !",
        ephemeral: true,
      });
    } else {
      queue = player.getQueue(interaction.guild.id);
      interaction.followUp({ content: `${queue.songs}`, ephemeral: false });
    }
    if (!queue.connection) {
      await queue.join(interaction.member.voice.channel);
    }
    let song = interaction.options.getString("url");
    song = await queue.playlist(song).catch((err) => {
      console.log(err);
      if (!guildQueue) queue.stop();
    });
    let nowplaying = queue.nowPlaying;
    await interaction.followUp({
      content: `${song.name} has been added to the queue!`,
    });
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
