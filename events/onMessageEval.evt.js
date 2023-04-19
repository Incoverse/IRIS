const eventInfo = {
  type: "onMessage",
};

let Discord = require("discord.js");
let moment = require("moment-timezone");
const { Util, MessageEmbed } = require("discord.js");
const { MongoClient } = require("mongodb");
/**
 *
 * @param {Discord.Message} message
 * @param {*} RM
 */
async function runEvent(message, RM) {
  if (message.guildId != global.app.config.mainServer) return;
  if (message.content.startsWith(".IRIS-EVAL ")) {
    await message.client.application.fetch();
    if (
      [
        ...Array.from(message.client.application.owner.members.keys()),
        ...global.app.config.externalOwners,
      ].includes(message.author.id)
    ) {
      const clean = async (text) => {
        // If our input is a promise, await it before continuing
        if (text && text.constructor.name == "Promise") text = await text;

        // If the response isn't a string, `util.inspect()`
        // is used to 'stringify' the code in a safe way that
        // won't error out on objects with circular references
        // (like Collections, for example)

        if (typeof text !== "string")
          text = require("util").inspect(text, { depth: 1 });

        // Replace symbols with character code alternatives
        text = text
          .replace(/`/g, "`" + String.fromCharCode(8203))
          .replace(/@/g, "@" + String.fromCharCode(8203));

        while (text.includes(message.client.token)) {
          text = text.replace(message.client.token, "[REDACTED]");
        }
        while (text.includes(process.env.DBPASSWD)) {
          text = text.replace(process.env.DBPASSWD, "[REDACTED]");
        }

        // Send off the cleaned up result
        return text;
      };

      const startRegex = /```(\n|js\n)/;
      const endRegex = /(|\n)```$/;
      const input = message.content
        .replace(".IRIS-EVAL ", "")
        .replace(startRegex, "")
        .replace(endRegex, "");
      let msg = await message.channel.send("Running....");
      let cleaned;
      try {
        // Evaluate (execute) our input
        const evaled = eval(input);
        // Put our eval result through the function
        // we defined above
        cleaned = await clean(evaled);

        // Reply in the channel with our result
        const parts = cleaned.match(/(.|[\r\n]){1,1990}/g) ?? [];

        msg.edit(`\`\`\`js\n${parts.shift()}\n\`\`\``);
        for (let msg of parts) {
          message.channel.send(`\`\`\`js\n${msg}\n\`\`\``);
        }
      } catch (err) {
        console.error(err);
        // Reply in the channel with our error
        msg.edit(`\`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
      }
    }
  }
}

module.exports = {
  runEvent,
  returnFileName: () => __filename.split("/")[__filename.split("/").length - 1],
  eventType: () => eventInfo.type,
  priority: () => 0,
};
