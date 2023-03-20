// //! -- This is the start of the IRIS journey -- !\\
const app = {
  version: "1.0.0",
};
global.app = app;
global.bannedUsers = [];
global.dirName = __dirname;
global.SlashCommandBuilder = require("@discordjs/builders").SlashCommandBuilder;
global.mongo = null;
const chalk = require("chalk");
try {
  const moment = require("moment");
  const {
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    REST,
    Routes,
    ActivityType,
  } = require("discord.js");
  const Discord = require("discord.js");
  require("dotenv").config();
  const fs = require("node:fs");
  const path = require("node:path");

  if (process.env.TOKEN == null) {
    console.log(
      "Token is missing, please make sure you have the .env file in the directory with the correct information. Please see https://github.com/InimicalPart/InBot for more information."
    );
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.AutoModerationConfiguration,
      GatewayIntentBits.AutoModerationExecution,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.DirectMessageTyping,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildEmojisAndStickers,
      GatewayIntentBits.GuildIntegrations,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildScheduledEvents,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildWebhooks,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.MessageContent,
    ],
  });
  const { MongoClient, ServerApiVersion } = require("mongodb");
  if (process.platform === "linux") {
    // if (!fs.existsSync("/etc/ssl/IRIS/certificate.pem")) {
    console.log(
      chalk.white.bold("[" + moment().format("M/D/y HH:mm:ss") + "] [MAIN] ") +
        "Grabbing certificate details...."
    );
    let certificate = fetch(process.env.cert).then((response) =>
      response.text()
    );
    fs.writeFileSync("/etc/ssl/IRIS/certificate.pem", certificate, {
      encoding: "utf-8",
    });
    app.certexpiry = new Date(
      await fetch(process.env.certexpiry).then((response) => response.text())
    );
    // }
  }

  let slashCommandAssigns = [];
  //!--------------------------
  console.clear();
  console.log(
    chalk.white.bold("[" + moment().format("M/D/y HH:mm:ss") + "] [MAIN] ") +
      chalk.green("IRIS ") +
      chalk.bold.white("v" + app.version) +
      chalk.green(" is starting up!") +
      "\n" +
      chalk.white.bold(
        "[" + moment().format("M/D/y HH:mm:ss") + "] [LOADER] "
      ) +
      chalk.yellow("Modules are loading up...")
  );
  console.log(
    chalk.white.bold("[" + moment().format("M/D/y HH:mm:ss") + "] [LOADER] ") +
      chalk.green("Modules loaded! Adding to requiredModules....")
  );
  //!--------------------------
  const requiredModules = {};
  console.log(
    chalk.blueBright("------------------------\n") +
      chalk.green("Added!\n") +
      chalk.blueBright("------------------------\n") +
      chalk.white("[I] ") +
      chalk.yellow("Logging in... ") +
      chalk.white("[I]")
  );
  let slashCommands = [];
  for (let i in requiredModules) {
    if (i.startsWith("cmd")) {
      if (requiredModules[i].getSlashCommand() !== null) {
        slashCommands.push(requiredModules[i].getSlashCommandJSON());
        slashCommandAssigns.push({
          commandName: requiredModules[i].getSlashCommandJSON().name,
          assignedTo: i,
        });
      }
    }
  }
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isCommand()) {
      if (
        global.bannedUsers.includes(
          interaction?.member?.user?.id || interaction?.user?.id
        )
      ) {
        return interaction.reply({
          content:
            "You are banned from using commands. If you believe this is an error, please contact Inimi#0565.",
          ephemeral: true,
        });
      }
      //   interaction.deferReply();
      for (let i in slashCommandAssigns) {
        if (slashCommandAssigns[i].commandName === interaction.commandName) {
          if (
            requiredModules[slashCommandAssigns[i].assignedTo] !== undefined
          ) {
            console.log(
              "Command " +
                chalk.white.bold(interaction.commandName) +
                " is assigned to " +
                chalk.white.bold(slashCommandAssigns[i].assignedTo)
            );
            runCMD(
              requiredModules[slashCommandAssigns[i].assignedTo],
              convertToMSG(interaction)
            );
          }
        }
      }
      return;
    }
  });

  async function runCMD(k, message) {
    // if (Discord.version > "13.7.0")
    //   message.channel.send({
    //     content:
    //       "**NOTE:** The discord API has updated. Some commands may not work properly!",
    //   });
    if (typeof message !== "string") {
      if (checkHasRequiredPermissions(k, message.guild)[0] === true)
        k.runCommand(
          message,
          message.content.split(" ").slice(1),
          requiredModules
        );
      else {
        message.channel.send({
          content:
            "I require permissions: [" +
            checkHasRequiredPermissions(k, message.guild)[1].join(", ") +
            "]",
        });
      }
    }
  }

  client.on("ready", async () => {
    const rest = new REST({
      version: "9",
    }).setToken(process.env.TOKEN);
    (async () => {
      try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(client.user.id), {
          body: slashCommands,
        });

        console.log(
          "Successfully reloaded application (/) commands. " +
            slashCommands.length +
            " commands loaded."
        );
      } catch (error) {
        console.error(error);
      }
    })();
    console.log(
      chalk.white("[I] ") + chalk.green("Logged in!") + chalk.white(" [I]")
    );
    client.user.setPresence({
      activities: [
        {
          name: "you ◭ /help",
          type: ActivityType.Watching,
        },
      ],
      status: "online",
    });
    const mainGuild = await client.guilds.fetch("1084667164843315230");
    let users = [];
    await mainGuild.members
      .fetch()
      .then(async (member) => member.forEach(async (m) => users.push(m.id)))
      .catch(console.error);
    const createdAt = mainGuild.createdAt;
    const today = new Date();
    var msSinceCreation = today.getTime() - createdAt.getTime();
    var daysSinceCreation = Math.round(msSinceCreation / (1000 * 3600 * 24));

    console.log(
      chalk.blueBright("------------------------\n") +
        chalk.redBright(mainGuild.name) +
        " has " +
        chalk.cyanBright(users.length) +
        " members.\n"
    );

    console.log(
      chalk.redBright(mainGuild.name) +
        " was created on the " +
        chalk.cyanBright(createdAt.toLocaleDateString()) +
        ". That's " +
        chalk.cyanBright(daysSinceCreation) +
        " days ago!"
    );
    let edition = "COMMUNITY";
    console.log(
      "------------------------\n" +
        "Current time is: " +
        chalk.cyanBright(
          DateFormatter.formatDate(
            new Date(),
            `MMMM ????, YYYY hh:mm:ss A`
          ).replace("????", getOrdinalNum(new Date().getDate()))
        ) +
        "\n" +
        "Discord.JS version: " +
        chalk.yellow(Discord.version) +
        "\n" +
        "Current API Latency: " +
        chalk.cyanBright(client.ws.ping) +
        " ms\n" +
        "------------------------\n" +
        chalk.blue.bold(client.user.tag) +
        " is ready and is running " +
        chalk.blue.bold(edition) +
        " edition!"
    );
  });

  /* prettier-ignore */
  function getOrdinalNum(n) { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
  /* prettier-ignore */
  const DateFormatter = { monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], formatDate: function (e, t) { var r = this; return t = r.getProperDigits(t, /d+/gi, e.getDate()), t = (t = r.getProperDigits(t, /M+/g, e.getMonth() + 1)).replace(/y+/gi, (function (t) { var r = t.length, g = e.getFullYear(); return 2 == r ? (g + "").slice(-2) : 4 == r ? g : t })), t = r.getProperDigits(t, /H+/g, e.getHours()), t = r.getProperDigits(t, /h+/g, r.getHours12(e.getHours())), t = r.getProperDigits(t, /m+/g, e.getMinutes()), t = (t = r.getProperDigits(t, /s+/gi, e.getSeconds())).replace(/a/gi, (function (t) { var g = r.getAmPm(e.getHours()); return "A" === t ? g.toUpperCase() : g })), t = r.getFullOr3Letters(t, /d+/gi, r.dayNames, e.getDay()), t = r.getFullOr3Letters(t, /M+/g, r.monthNames, e.getMonth()) }, getProperDigits: function (e, t, r) { return e.replace(t, (function (e) { var t = e.length; return 1 == t ? r : 2 == t ? ("0" + r).slice(-2) : e })) }, getHours12: function (e) { return (e + 24) % 12 || 12 }, getAmPm: function (e) { return e >= 12 ? "pm" : "am" }, getFullOr3Letters: function (e, t, r, g) { return e.replace(t, (function (e) { var t = e.length; return 3 == t ? r[g].substr(0, 3) : 4 == t ? r[g] : e })) } };

  client.login(process.env.TOKEN);
} catch (e) {
  console.log(
    chalk.hex("#FF0000").bold("-----------------------------------[") +
      chalk.white.bold(e.toString().replace(/:.*/g, "")) +
      chalk.hex("#FF0000").bold("]-----------------------------------\n")
  );
  console.log(e);
  console.log(
    chalk.hex("#FF0000").bold("\n-----------------------------------[") +
      chalk.white.bold(e.toString().replace(/:.*/g, "")) +
      chalk.hex("#FF0000").bold("]-----------------------------------")
  );
}
