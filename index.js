// //! -- This is the start of the IRIS journey -- !\\
(async () => {
  const app = {
    version: "1.0.0",
  };
  global.app = app;
  global.bannedUsers = [];
  global.birthdays = [];
  global.newMembers = [];
  const chalk = require("chalk");
  global.chalk = chalk;
  global.dirName = __dirname;
  global.SlashCommandBuilder =
    require("@discordjs/builders").SlashCommandBuilder;
  const JsonCParser = require("jsonc-parser");
  app.config = JsonCParser.parse(
    require("fs").readFileSync("./config.jsonc", { encoding: "utf-8" })
  );
  global.app.debugLog = app.config.debugging ? console.log : () => {};
  global.mongoConnectionString = null;
  if (global.app.config.development) {
    global.app.config.mainServer = global.app.config.developmentServer;
  }
  require("dotenv").config();
  try {
    const moment = require("moment");
    const {
      Client,
      Events,
      GatewayIntentBits,
      REST,
      Routes,
      ActivityType,
    } = require("discord.js");
    const Discord = require("discord.js");
    const fs = require("node:fs");
    const path = require("node:path");
    const prettyms = (await import("pretty-ms")).default;

    if (process.env.TOKEN == null) {
      console.log(
        "Token is missing, please make sure you have the .env file in the directory with the correct information. Please see https://github.com/InimicalPart/IRIS for more information."
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

    global.mongoConnectionString =
      "mongodb://iris:" +
      process.env.DBPASSWD +
      "@extension.inimicalpart.com:27017/?authMechanism=DEFAULT&tls=true";

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
      chalk.white.bold(
        "[" + moment().format("M/D/y HH:mm:ss") + "] [LOADER] "
      ) + chalk.green("Modules loaded! Adding to requiredModules....")
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
    client.on(Events.MessageCreate, async (message) => {
      for (let i in requiredModules) {
        if (i.startsWith("event")) {
          if (requiredModules[i].eventType() === "onMessage") {
            requiredModules[i].runEvent(message, requiredModules);
          }
        }
      }
    });
    const { MongoClient } = require("mongodb");

    client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.guildId !== global.app.config.mainServer) return;
      const client = new MongoClient(global.mongoConnectionString);
      try {
        const database = client.db("IRIS");
        const userdata = database.collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
        let a;
        // Query for a movie that has the title 'Back to the Future'
        const query = { id: interaction.user.id };
        let userInfo = await userdata.findOne(query);
        if (userInfo == null) {
          userInfo = {
            id: interaction.user.id,
            discriminator: interaction.user.discriminator,
            last_active: new Date().toISOString(),
            timezones: [],
            username: interaction.user.username,
            approximatedTimezone: null,
            birthday: null,
            isNew:
              new Date() -
                (await interaction.guild.members.fetch(interaction.user.id))
                  .joinedAt <
              7 * 24 * 60 * 60 * 1000,
          };
          a = await userdata.insertOne(userInfo);
        } else {
          const updateDoc = {
            $set: {
              last_active: new Date().toISOString(),
            },
          };
          await userdata.updateOne(query, updateDoc, {});
        }
      } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
      }
      if (!interaction.isChatInputCommand()) return;
      for (let command in requiredModules) {
        if (command.startsWith("cmd")) {
          if (
            interaction.commandName == command.replace("cmd", "").toLowerCase()
          ) {
            requiredModules[command].runCommand(interaction, requiredModules);
          }
        }
      }
    });

    client.on(Events.ClientReady, async () => {
      const commands = [];
      // Grab all the command files from the commands directory you created earlier
      const commandsPath = path.join(__dirname, "commands");
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith(".cmd.js"));

      // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
      for (const file of commandFiles) {
        /* prettier-ignore */
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] [MAIN] ")+"Registering command: " +chalk.blueBright(file));
        const command = require(`./commands/${file}`);
        requiredModules[
          "cmd" +
            command.getSlashCommand().name[0].toUpperCase() +
            command.getSlashCommand().name.slice(1)
        ] = command;
        commands.push(command.getSlashCommandJSON());
      }

      const eventsPath = path.join(__dirname, "events");
      const eventFiles = fs
        .readdirSync(eventsPath)
        .filter((file) => file.endsWith(".evt.js"));

      // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
      for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        requiredModules[
          "event" +
            file.replace(".evt.js", "")[0].toUpperCase() +
            file.replace(".evt.js", "").slice(1)
        ] = event;
      }
      const rest = new REST({
        version: "9",
      }).setToken(process.env.TOKEN);
      (async () => {
        try {
          await rest.put(
            global.app.config.development
              ? Routes.applicationGuildCommands(
                  client.user.id,
                  global.app.config.mainServer
                )
              : Routes.applicationCommands(client.user.id),
            {
              body: commands,
            }
          );
        } catch (error) {
          console.error(error);
        }
      })();
      console.log(
        chalk.white("[I] ") + chalk.green("Logged in!") + chalk.white(" [I]")
      );
      if (!global.app.config.development)
        client.user.setPresence({
          activities: [
            {
              name: "you ◭ /help",
              type: ActivityType.Watching,
            },
          ],
          status: "online",
        });
      const mainServer = await client.guilds.fetch(
        global.app.config.mainServer
      );
      let users = [];
      await mainServer.members
        .fetch()
        .then(async (member) => member.forEach(async (m) => users.push(m.id)))
        .catch(console.error);

      console.log(
        chalk.blueBright("------------------------\n") +
          chalk.redBright(mainServer.name) +
          " has " +
          chalk.cyanBright(users.length) +
          " members."
      );
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
          chalk.blue.bold(
            global.app.config.development ? "DEVELOPMENT" : "COMMUNITY"
          ) +
          " edition!\n" +
          "------------------------"
      );
      const clienttwo = new MongoClient(global.mongoConnectionString);
      Events.GuildMemberUpdate;
      try {
        const database = clienttwo.db("IRIS");
        const userdata = database.collection(
          global.app.config.development ? "userdata_dev" : "userdata"
        );
        const documents = await userdata.find().toArray();
        for (let document of documents) {
          let obj = {
            id: document.id,
            birthday: document.birthday,
            timezone: document.approximatedTimezone,
          };
          if (document.birthday !== null) global.birthdays.push(obj);
          if (document.isNew) {
            global.newMembers.push(document.id);
          }
        }
      } finally {
        await clienttwo.close();
      }
      const guild = await client.guilds.fetch(global.app.config.mainServer);
      let newMembersRole = null;
      await guild.roles.fetch().then((roles) => {
        roles.forEach((role) => {
          if (role.name.toLowerCase().includes("new member")) {
            newMembersRole = role;
          }
        });
      });
      if (newMembersRole !== null) {
        newMembersRole.members.forEach((member) => {
          global.newMembers.push(member.id);
        });
        global.newMembers = [...new Set(global.newMembers)];
      }

      for (let i in requiredModules) {
        if (i.startsWith("event")) {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] [MAIN] ")+"Registering '"+chalk.yellow(requiredModules[i].eventType())+("discordEvent"===requiredModules[i].eventType()?" ("+chalk.blue.bold(requiredModules[i].getListenerKey())+")":"")+("runEvery"===requiredModules[i].eventType()?" ("+chalk.yellow(prettyms(requiredModules[i].getMS(),{verbose:!0}))+")":"")+"' event: "+chalk.blueBright(requiredModules[i].returnFileName()));
          if (requiredModules[i].eventType() === "runEvery") {
            if (requiredModules[i].runImmediately()) {
              /* prettier-ignore */
              global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] [MAIN] ")+"Running '"+chalk.yellow(requiredModules[i].eventType())+" ("+chalk.blue.bold("runImmediately")+")' event: "+chalk.blueBright(requiredModules[i].returnFileName()));
              await requiredModules[i].runEvent(client, requiredModules);
            }
            setInterval(async () => {
              if (!requiredModules[i].running) {
                /* prettier-ignore */
                global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] [MAIN] ")+"Running '"+chalk.yellow(requiredModules[i].eventType())+" ("+chalk.yellow(prettyms(requiredModules[i].getMS(),{verbose: true}))+")' event: "+chalk.blueBright(requiredModules[i].returnFileName()));
                await requiredModules[i].runEvent(client, requiredModules);
              } else {
                /* prettier-ignore */
                global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] [MAIN] ")+"Not running '"+chalk.yellow(requiredModules[i].eventType())+" ("+chalk.yellow(prettyms(requiredModules[i].getMS(),{verbose: true}))+")' event: "+chalk.blueBright(requiredModules[i].returnFileName())+" reason: Previous interation is still running.");
              }
            }, requiredModules[i].getMS());
          } else if (requiredModules[i].eventType() === "discordEvent") {
            client.on(requiredModules[i].getListenerKey(), async (...args) => {
              /* prettier-ignore */
              global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] [MAIN] ")+"Running '"+chalk.yellow(requiredModules[i].eventType())+" ("+chalk.blue.bold(requiredModules[i].getListenerKey())+")' event: "+chalk.blueBright(requiredModules[i].returnFileName()));
              await requiredModules[i].runEvent(requiredModules, ...args);
            });
          } else if (requiredModules[i].eventType() === "onStart") {
            global.app.debugLog(
              chalk.white.bold(
                "[" + moment().format("M/D/y HH:mm:ss") + "] [MAIN] "
              ) +
                "Running '" +
                chalk.yellow(requiredModules[i].eventType()) +
                "' event: " +
                chalk.blueBright(requiredModules[i].returnFileName())
            );
            await requiredModules[i].runEvent(client, requiredModules);
          }
        }
      }
      console.log(
        chalk.white.bold(
          "[" + moment().format("M/D/y HH:mm:ss") + "] [MAIN] "
        ) +
          "All commands and events have been registered. " +
          eventFiles.length +
          " event(s), " +
          commands.length +
          " command(s)."
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
})();
