/*
 * Copyright (c) 2023 Inimi | InimicalPart | Incoverse
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import {
  Collection,
  Guild,
  GuildMember,
  Message,
  Role,
  Snowflake,
  UserResolvable,
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  ActivityType,
  version,
  Team,
  CommandInteraction,
  CommandInteractionOptionResolver,
  EmbedBuilder,
  CacheType,
  GuildMemberRoleManager,
  PermissionsBitField,
} from "discord.js";
import { AppInterface } from "./interfaces/appInterface.js";
import { IRISGlobal } from "./interfaces/global.js";
import prettyMilliseconds from "pretty-ms";
import chalk from "chalk";
import { EventEmitter } from "events";
import JsonCParser from "jsonc-parser";
import { readFileSync, readdirSync, existsSync, writeFileSync, createWriteStream, mkdirSync,unlinkSync } from "fs";
import dotenv from "dotenv";
import moment from "moment-timezone";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { promisify, inspect } from "util";
import {exec} from "child_process";

import performance from "./lib/performance.js";
const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();
declare const global: IRISGlobal;

//! ------------------------------------------- !\\
//! -- This is the start of the IRIS journey -- !\\
//! ------------------------------------------- !\\

(async () => {
  performance.start("fullRun");
  let fullyReady = false;
  const config = JsonCParser.parse(
    readFileSync("./config.jsonc", { encoding: "utf-8" })
  );
  if (!existsSync("./local_config.json")) {
    writeFileSync(
      "./local_config.json",
      JSON.stringify({
        presence: {
          text: "you",
          type: ActivityType.Watching,
        },
        disabledCommands: [],
        disabledEvents: [],
      })
    );
  }
  const localConfig = JSON.parse(
    readFileSync("./local_config.json", { encoding: "utf-8" })
  );
  global.logName = `IRIS-${new Date().getTime()}.log`;
  // if the logs folder doesn't exist, create it. if the log folder has more than 10 files, delete the oldest one. you can check which one is the oldest one by the numbers after IRIS- and before .log. the lower the number, the older it is
  if (!existsSync("./logs")) {
    mkdirSync("./logs");
  } else {
    const logFiles = readdirSync("./logs");
    if (logFiles.length > 9) {
      const oldestLog = logFiles.sort((a, b) => {
        return parseInt(a.split("-")[1].split(".")[0]) - parseInt(b.split("-")[1].split(".")[0]);
      })[0];
      unlinkSync(`./logs/${oldestLog}`);
    }
  }
  const logStream = createWriteStream(`./logs/${global.logName}`);
  global.logger = {
    log: (message: any, sender: string) => {
      if (typeof message !== "string") message = inspect(message, { depth: 1 });
      console.log(
        chalk.white.bold(
          "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] [" +
          sender +
          "]"), message
      );
          // clear chalk coloring for log file
      message = message.replace(/\u001b\[.*?m/g, "");
      logStream.write(
        "[" +
        moment().format("M/D/y HH:mm:ss") +
        "] [LOG] [" +
        sender +
        "] " +
        message +
        "\n"
      );
    },
    error: (message: any, sender: string) => {
      message = (message && message.stack) ? message.stack : message
      if (typeof message !== "string") message = inspect(message, { depth: 1 });
      console.log(
        chalk.white.bold(
          "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] ")+chalk.redBright("[" +
          sender +
          "]"), message
      );
      message = message.replace(/\u001b\[.*?m/g, "");
      logStream.write(
        "[" +
        moment().format("M/D/y HH:mm:ss") +
        "] [ERR] [" +
        sender +
        "] " +
        message +
        "\n"
      );
    },
    warn: (message: any, sender: string) => {
      if (typeof message !== "string") message = inspect(message, { depth: 1 });
      console.log(
        chalk.white.bold(
          "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] ")+chalk.yellow("[" +
          sender +
          "]"), message
      );
      message = message.replace(/\u001b\[.*?m/g, "");
      logStream.write(
        "[" +
        moment().format("M/D/y HH:mm:ss") +
        "] [WRN] [" +
        sender +
        "] " +
        message +
        "\n"
      );
    },
    debug: (message: any, sender: string) => {
      if (config.debugging) {
      if (typeof message !== "string") message = inspect(message, { depth: 1 });
      console.log(
          chalk.white.bold(
            "[" +
            moment().format("M/D/y HH:mm:ss") +
            "] [" +
            sender +
            "]"), message
        );
      message = message.replace(/\u001b\[.*?m/g, "");
      logStream.write(
          "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] [DBG] [" +
          sender +
          "] " +
          message +
          "\n"
        );
      }
    },
    debugError: (message: any, sender: string) => {
      if (config.debugging) {
        message = (message && message.stack) ? message.stack : message
      if (typeof message !== "string") message = inspect(message, { depth: 1 });
      console.log(
          chalk.white.bold(
            "[" +
            moment().format("M/D/y HH:mm:ss") +
            "] ")+chalk.redBright("[" +
            sender +
            "]"), message
        );
      message = message.replace(/\u001b\[.*?m/g, "");
      logStream.write(
          "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] [DER] [" +
          sender +
          "] " +
          message +
          "\n"
        );
      }
    },
    debugWarn: (message: any, sender: string) => {
      if (config.debugging) {
      if (typeof message !== "string") message = inspect(message, { depth: 1 });
      console.log(
          chalk.white.bold(
            "[" +
            moment().format("M/D/y HH:mm:ss") +
            "] ")+chalk.yellow("[" +
            sender +
            "]"), message
        );
      message = message.replace(/\u001b\[.*?m/g, "");
      logStream.write(
          "[" +
          moment().format("M/D/y HH:mm:ss") +
          "] [DWR] [" +
          sender +
          "] " +
          message +
          "\n"
        );
      }
    }
  }
  const app: AppInterface = {
    version: JSON.parse(readFileSync("./package.json", { encoding: "utf-8" }))
      .version,
    localConfig: localConfig,
    config: config,
    owners: [], // this will be filled in later
  };
  
  global.app = app;
  global.bannedUsers = [];
  global.birthdays = [];
  global.communicationChannel = new EventEmitter();
  global.newMembers = [];
  const requiredPermissions = [
    PermissionsBitField.Flags.AddReactions,
    PermissionsBitField.Flags.AttachFiles,
    PermissionsBitField.Flags.ManageMessages,
    PermissionsBitField.Flags.ManageRoles,
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.UseExternalEmojis,
    PermissionsBitField.Flags.ViewChannel,
  ]
  process.on('uncaughtException', function(err) {
    global.logger.debugError((err && err.stack) ? err.stack : err, "IRIS-ERR");
  });
  const onExit = (a: string | number) => {
    if (a==2) return
    global.logger.log("IRIS is shutting down...", "IRIS-"+a);
    process.exit(2);
  }
  //catches ctrl+c event
  process.on('exit', onExit.bind("exit"));
  process.on('SIGINT', onExit.bind("SIGINT"));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', onExit.bind("SIGUSR1"));
  process.on('SIGUSR2', onExit.bind("SIGUSR2"));


  global.mongoStatuses = {
    RUNNING: 0,
    RESTARTING: 1,
    STOPPED: 2,
    FAILED: 3,
    NOT_AVAILABLE: 4,
  };
  global.reload = {
    commands: []
  };
  global.overrides = {
     //! These overrides get replaced by the event onReadySetupOVRD.evt.ts 
  }
  global.loggingData = {
    joins: [],
    leaves: [],
    messages: 0,
  };

  global.mongoStatus = global.mongoStatuses.NOT_AVAILABLE
  global.app.config.development = process.env.DEVELOPMENT == "YES";
  if (!global.app.config.development) {
    try {

      await execPromise("systemctl status mongod | grep 'active (running)'");
      global.mongoStatus = global.mongoStatuses.RUNNING
    } catch (e) {
      global.mongoStatus = global.mongoStatuses.STOPPED
    }
  }
  global.games = {
    uno: {
      maxPlayers: 4
    },
  };
  global.dirName = __dirname;
  if (process.env.DBUSERNAME == "iris" && global.app.config.development) {
    global.logger.log("Hold on! You are attempting to run IRIS in development mode, but are using the main database credentials, which is not allowed. Please change the DBUSERNAME and DBPASSWD in the .env file to the development credentials.", returnFileName());
    process.exit(1);
  }
  global.mongoConnectionString =
    "mongodb://" +
    process.env.DBUSERNAME
    + ":" +
    process.env.DBPASSWD +
    "@ext.kennevo.com:27017/?authMechanism=DEFAULT&tls=true&family=4";
  global.resources = {
    wordle: {
      validGuesses: (
        await fetch(app.config.resources.wordle.validGuesses).then((res) =>
          res.text()
        )
      ).split("\n"),
      validWords: (
        await fetch(app.config.resources.wordle.validWords).then((res) =>
          res.text()
        )
      ).split("\n"),
    },
  };

  if (global.app.config.development) {
    global.app.config.mainServer = global.app.config.developmentServer;
  }
  try {
    if (process.env.TOKEN == null) {
      global.logger.log(
        "Token is missing, please make sure you have the .env file in the directory with the correct information. Please see https://github.com/Incoverse/IRIS for more information.", returnFileName()
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

    //!--------------------------
    console.clear();

    global.logger.log(`${chalk.green("IRIS")} ${chalk.bold.white(`v${app.version}`)} ${chalk.green("is starting up!")}`, returnFileName());
    global.logger.log("------------------------", returnFileName());

    //!--------------------------
    const requiredModules: { [key: string]: any } = {};

    global.logger.log(`${chalk.white("[I]")} ${chalk.yellow("Logging in...")} ${chalk.white("[I]")}`, returnFileName());

    client.on(Events.InteractionCreate, async (interaction: any) => {
      if (!fullyReady) {
        return await interaction.reply({
          content:
            "I'm still starting up, please wait a few seconds and try again.",
          ephemeral: true,
        });
      }
      if (global.mongoStatus == global.mongoStatuses.RESTARTING) {
        return await interaction.reply({
          content:
            "The database is currently restarting, please wait a few seconds and try again.",
          ephemeral: true,
        });
      }
      if (interaction.guild == null)
        return await interaction.reply(
          ":x: This command can only be used in a server."
        );
      if (interaction.guildId !== global.app.config.mainServer) return;
      const client = new MongoClient(global.mongoConnectionString);
      try {
        const database = client.db(global.app.config.development ? "IRIS_DEVELOPMENT" : "IRIS");
        const userdata = database.collection(
          global.app.config.development ? "DEVSRV_UD_"+global.app.config.mainServer : "userdata"
        );
        const query = { id: interaction.user.id };
        userdata.findOne(query).then((result) => {
          const user = interaction.member;
          if (result == null) {
            const entry = {
              ...global.app.config.defaultEntry,
              ...{
                id: interaction.user.id,
                last_active: new Date().toISOString(),
                username: interaction.user.username,
                isNew:
                  new Date().getTime() - (user.joinedAt?.getTime() ?? 0) <
                  7 * 24 * 60 * 60 * 1000,
              },
            };
            if (
              interaction.user.discriminator !== "0" &&
              interaction.user.discriminator
            )
              (entry.discriminator = interaction.user.discriminator),
                userdata.insertOne(entry).then(() => {
                  client.close();
                });
          } else {
            const updateDoc = {
              $set: {
                last_active: new Date().toISOString(),
              },
            };
            userdata.updateOne(query, updateDoc, {}).then(() => {
              client.close();
            });
          }
        });
      } catch {
        // Ensures that the client will close when you finish/error
        client.close();
      }
      if (!interaction.isChatInputCommand()) return;
      let fullCmd = interaction.commandName;
      if ((
        interaction.options as CommandInteractionOptionResolver
      ).getSubcommandGroup(false)) {
        fullCmd += ` ${(interaction.options as CommandInteractionOptionResolver).getSubcommandGroup()}`;
      }
      if ((
        interaction.options as CommandInteractionOptionResolver
      ).getSubcommand(false)) {
        fullCmd += ` ${(interaction.options as CommandInteractionOptionResolver).getSubcommand()}`;
      }
      
      let found = false
      for (let command in requiredModules) {
        if (command.startsWith("cmd")) {
          if (
            interaction.commandName == command.replace("cmd", "").toLowerCase()
          ) {
            found = true
            if (await checkPermissions(interaction, fullCmd)) {
                requiredModules[command].runCommand(interaction, requiredModules).then(async (res)=>{
                  if (res == false) return
                  if (!interaction.replied && !interaction.deferred) {
                    global.logger.debugWarn(
                      `${interaction.user.username} ran command '${chalk.yellowBright("/"+await getFullCMD(interaction))}' which triggered handler '${chalk.yellowBright(requiredModules[command].returnFileName())}' but it appears that the command did not reply or defer the interaction. This is not recommended.`,
                      returnFileName()
                    );
                    await interaction.reply({
                      embeds: [
                        new EmbedBuilder().setTitle("Command failed").setDescription(
                        "We're sorry, this command could currently not be processed by IRIS, please try again later."
                      ).setColor("Red")
                    ],
                    ephemeral: true,
                  })
                }
              })
              } else {
              // global.logger.debugError(`${interaction.user.username} tried to run command '/${fullCmd}' but was denied access.`, returnFileName())
              await interaction.reply({
                embeds: [
                  new EmbedBuilder().setTitle("Access Denied").setDescription(
                    "You do not have permission to run this command."
                  ).setColor("Red").setFooter({
                    text: interaction.user.username,
                    iconURL: interaction.user.avatarURL()
                  })
                ],
                ephemeral: true,
              });
            }
          }
        }
      }
      if (!found) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder().setTitle("Command failed").setDescription(
              "We're sorry, a handler for this command could not be located, please try again later."
            ).setColor("Red")
          ],
          ephemeral: true,
        })
      }
    });

    client.on(Events.ClientReady, async () => {
      const finalLogInTime = performance.end("logInTime", {
        silent: true,
      })
      global.logger.log(`${chalk.white("[I]")} ${chalk.green("Logged in!")} ${chalk.white("[I]")}`, returnFileName());
      global.logger.log("------------------------", returnFileName());


      // Check if bot has every permission it needs in global.app.config.mainServer
      const guild = await client.guilds.fetch(global.app.config.mainServer);
      const me = await guild.members.fetch(client.user.id);
      const perms = me.permissions;
      let hasAllPerms = true
      global.logger.debug(
        // check permissions in <server name>
        `Checking permissions in ${chalk.cyanBright(guild.name)}`,
        returnFileName()
      )
      global.logger.log("------------------------", returnFileName());
      performance.start("permissionCheck"); 
      for (let i of requiredPermissions) {
        if (!perms.has(i)) {
          global.logger.debugError(
            `${chalk.redBright.bold(client.user.username)} is missing permission ${chalk.redBright.bold(new PermissionsBitField(i).toArray()[0])}!`,
            returnFileName()
          );
          hasAllPerms = false
        } else {
          performance.pause("fullRun")
          performance.pause("permissionCheck"); // pause the timer so that the log time isn't included 
          global.logger.debug(
            `${chalk.yellowBright(client.user.username)} has permission ${chalk.yellowBright(new PermissionsBitField(i).toArray()[0])}.`,
            returnFileName()
          )
          performance.resume("fullRun")
          performance.resume("permissionCheck");
        }
      }
      const finalPermissionCheckTime = performance.end("permissionCheck", { //1.234ms 
        silent: true,
      })
      
      global.logger.log("------------------------", returnFileName());
      if (!hasAllPerms) {
        global.logger.debugError(
          `${chalk.redBright.bold(client.user.username)} is missing one or more permissions! Please grant them and restart the bot.`,
          returnFileName()
        );
        process.exit(1);
      }


      performance.start("commandRegistration");
      const commands: Array<string> = [];
      // Grab all the command files from the commands directory you created earlier
      const commandsPath = join(__dirname, "commands");
      const commandFiles = readdirSync(commandsPath).filter((file: string) =>
        file.endsWith(".cmd.js")
      );

      // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
      for (const file of commandFiles) {
        const command: IRISCommand = await import(`./commands/${file}`);
        if (
          command.commandSettings().devOnly &&
          command.commandSettings().mainOnly
        ) {
          performance.pause("fullRun")
          performance.pause("commandRegistration");
          /* prettier-ignore */
          global.logger.debugError(`Error while registering command: ${chalk.redBright(file)} (${chalk.redBright("Command cannot be both devOnly and mainOnly!")})`,returnFileName());
          performance.resume("fullRun")
          performance.resume("commandRegistration");
          continue;
        }
        if (!global.app.config.development && command.commandSettings().devOnly)
          continue;
        if (global.app.config.development && command.commandSettings().mainOnly)
          continue;

        
        performance.pause("fullRun")
        performance.pause("commandRegistration");
        /* prettier-ignore */
        global.logger.debug(`Registering command: ${chalk.blueBright(file)}`,returnFileName());
        performance.resume("fullRun")
        performance.resume("commandRegistration");

        if (!(await command.setup(client, requiredModules))) {
          performance.pause("fullRun")
          performance.pause("commandRegistration");
          global.logger.debugError(`Command ${chalk.redBright(file)} failed to complete setup script. Command will not be loaded.`,returnFileName());
          performance.resume("fullRun")
          performance.resume("commandRegistration");
          continue

        }

        requiredModules[
          "cmd" +
            command.getSlashCommand().name[0].toUpperCase() +
            command.getSlashCommand().name.slice(1)
        ] = command;
        commands.push(command?.getSlashCommand()?.toJSON());
      }
      const finalCommandRegistrationTime = performance.end("commandRegistration", {silent: true})
      global.reload.commands = commands;
      await client.application.fetch();
      if (client.application.owner instanceof Team) {
        global.app.owners = Array.from(
          client.application.owner.members.keys()
        );
      } else {
        global.app.owners = [client.application.owner.id];
      }
      global.app.owners = [...global.app.owners, ...global.app.config.externalOwners];
      global.logger.log("------------------------", returnFileName());
      performance.start("eventLoader");
      const eventsPath = join(__dirname, "events");
      const eventFiles = readdirSync(eventsPath).filter((file: string) =>
        file.endsWith(".evt.js")
      );
      // const eventFiles = []

      // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
      for (const file of eventFiles) {
        const event: IRISEvent = await import(`./events/${file}`);
        if (!(event.eventSettings().devOnly && event.eventSettings().mainOnly)) {

          if (!global.app.config.development && event.eventSettings().devOnly)
          continue;
          if (global.app.config.development && event.eventSettings().mainOnly)
          continue;
        } else {
          
          performance.pause("fullRun")
          performance.pause("eventLoader");
          /* prettier-ignore */
          global.logger.debugError(`Error while loading event: ${chalk.redBright(file)} (${chalk.redBright("Event cannot be both devOnly and mainOnly!")})`,returnFileName());
          performance.resume("fullRun")
          performance.resume("eventLoader");
          continue;
        }

        global.logger.debug(
          `Registering event: ${chalk.blueBright(file)}`,
          returnFileName()
        );

        if (!(await event.setup(client, requiredModules))) {
          performance.pause("fullRun")
          performance.pause("eventLoader");
          global.logger.debugError(`Event ${chalk.redBright(file)} failed to complete setup script. Event will not be loaded.`,returnFileName());
          performance.resume("fullRun")
          performance.resume("eventLoader");
          continue
        }

        
        requiredModules[
          "event" +
            file.replace(".evt.js", "")[0].toUpperCase() +
            file.replace(".evt.js", "").slice(1)
        ] = event;
      }
      const finalEventLoaderTime = performance.end("eventLoader", {silent: true})
      global.logger.log("------------------------", returnFileName());
      global.rest = new REST({
        version: "9",
      }).setToken(process.env.TOKEN);
      (async () => {
        try {
          await global.rest.put(
            Routes.applicationGuildCommands(
              client.user.id,
              global.app.config.mainServer
            ),
            {
              body: commands,
            }
          );
        } catch (error) {
          global.logger.error(error, returnFileName());
        }
      })();
      if (!global.app.config.development) {
        if (
          !global.app.localConfig.presence.type &&
          !global.app.localConfig.presence.text
        )
          return;
        client.user.setPresence({
          activities: [
            {
              name: global.app.localConfig.presence.text,
              type: global.app.localConfig.presence.type,
            },
          ],
          status: "online",
        });
      }
      const mainServer = await client.guilds.fetch(
        global.app.config.mainServer
      );
      // let users: Array<UserResolvable> = [];
      // await mainServer.members
      //   .fetch()
      //   .then(async (member: Collection<Snowflake, GuildMember>) =>
      //     member.forEach(async (m: GuildMember) => users.push(m.id))
      //   )
      //   .catch(console.error);

      // const guild: Guild = await client.guilds.fetch(
      //   global.app.config.mainServer
      // );
      await guild.roles
        .fetch()
        .then((roles: Collection<Snowflake, Role>): void => {
          roles.forEach((role: Role) => {
            if (role.name.toLowerCase().includes("new member")) {
              role.members.forEach((member: GuildMember) => {
                if (!global.newMembers.includes(member.id))
                  global.newMembers.push(member.id);
              });
              return;
            }
          });
        });

      const prioritizedTable: { [key: string]: any } = {};
      for (let i of Object.keys(requiredModules)) {
        if (i.startsWith("event")) {
          const priority: number = requiredModules[i].priority() ?? 0;
          const priorityKey: string = Number(priority).toString();
          prioritizedTable[priorityKey] = prioritizedTable[priorityKey] ?? [];
          prioritizedTable[priorityKey].push(i);
        }
      }

      performance.start("eventRegistration");
      for (const prio of Object.keys(prioritizedTable).sort(
        (a: string, b: string) => parseInt(b) - parseInt(a)
      )) {
        for (let i of prioritizedTable[prio]) {
          const adder = ("discordEvent" === requiredModules[i].eventType()? " (" +chalk.cyan.bold(requiredModules[i].getListenerKey()) +")": (
            "runEvery" === requiredModules[i].eventType()? " (" +chalk.hex("#FFA500")(prettyMilliseconds(requiredModules[i].getMS(), {verbose: !0,})) +")": ""
          ))
          const eventType = chalk.yellowBright(requiredModules[i].eventType())
          const eventName = chalk.blueBright(requiredModules[i].returnFileName())
          if (
            requiredModules[i].eventSettings().devOnly &&
            requiredModules[i].eventSettings().mainOnly
          ) {
            performance.pause("fullRun")
            performance.pause("eventRegistration")
            /* prettier-ignore */
            global.logger.debugError(`${chalk.redBright("Error while registering")} '${eventType}${adder}' ${chalk.redBright("event")}: ${chalk.redBright(requiredModules[i].returnFileName())} (${chalk.redBright("Event cannot be both devOnly and mainOnly!")})`,returnFileName());
            performance.resume("fullRun")
            performance.resume("eventRegistration")
            delete requiredModules[i]
            delete prioritizedTable[prio][i]
            continue;
          }
          /* prettier-ignore */
          if (!eventType.includes("onStart")) {
            performance.pause("fullRun")
            performance.pause("eventRegistration")
            global.logger.debug(`Registering '${eventType}${adder}' event: ${eventName}`, returnFileName());
            performance.resume("fullRun")
            performance.resume("eventRegistration")
          }
          if (requiredModules[i].eventType() === "runEvery") {
            const prettyInterval = chalk.hex("#FFA500")(prettyMilliseconds(requiredModules[i].getMS(),{verbose: true}))
            if (requiredModules[i].runImmediately()) {
              performance.pause("fullRun")
              performance.pause("eventRegistration")
              /* prettier-ignore */
              global.logger.debug(`Running '${eventType} (${chalk.cyan.bold("runImmediately")})' event: ${eventName}`, returnFileName());
              performance.resume("fullRun")
              performance.resume("eventRegistration")
              await requiredModules[i].runEvent(client, requiredModules);
            }
            setInterval(async () => {
              if (!requiredModules[i].running) {
                /* prettier-ignore */
                global.logger.debug(`Running '${eventType} (${prettyInterval})' event: ${eventName}`,returnFileName());
                await requiredModules[i].runEvent(client, requiredModules);
              } else {
                /* prettier-ignore */
                global.logger.debugError(`Not running '${eventType} (${prettyInterval})' event: ${eventName} reason: Previous iteration is still running.`, returnFileName());
              }
            }, requiredModules[i].getMS());
          } else if (requiredModules[i].eventType() === "discordEvent") {
            const listenerKey = chalk.cyan.bold(requiredModules[i].getListenerKey())
            client.on(
              requiredModules[i].getListenerKey(),
              async (...args: any) => {
                /* prettier-ignore */
                if (requiredModules[i].getListenerKey() != Events.MessageCreate)
                  global.logger.debug(`Running '${eventType} (${listenerKey})' event: ${eventName}`,returnFileName());
                await requiredModules[i].runEvent(requiredModules, ...args);
              }
            );
          } else if (requiredModules[i].eventType() === "onStart") {
            performance.pause("fullRun")
            performance.pause("eventRegistration")
            global.logger.debug(
              `Running '${eventType}' event: ${eventName}`, returnFileName()
            );
            performance.resume("fullRun")
            performance.resume("eventRegistration")
            await requiredModules[i].runEvent(client, requiredModules);
          }
        }
      }
      const finalEventRegistrationTime = performance.end("eventRegistration",{silent: true});
      const finalTotalTime = performance.end("fullRun", {silent:true})
      global.logger.log("", returnFileName());
      global.logger.log(`All commands and events have been registered. ${chalk.yellowBright(eventFiles.length)} event(s), ${chalk.yellowBright(commands.length)} command(s).`, returnFileName());
      global.logger.debug("------------------------", returnFileName());
      global.logger.debug("Bot log in time: " + chalk.yellowBright(finalLogInTime), returnFileName());
      global.logger.debug("Permission check time: " + chalk.yellowBright(finalPermissionCheckTime), returnFileName());
      global.logger.debug("Command registration time: " + chalk.yellowBright(finalCommandRegistrationTime), returnFileName());
      global.logger.debug("Event load time: " + chalk.yellowBright(finalEventLoaderTime), returnFileName());
      global.logger.debug("Event registration time: " + chalk.yellowBright(finalEventRegistrationTime), returnFileName());
      global.logger.debug("", returnFileName());
      global.logger.debug("Full load time: " + chalk.yellowBright(finalTotalTime), returnFileName());
      global.logger.log("------------------------", returnFileName());
      /* prettier-ignore */
      const DaT = DateFormatter.formatDate(new Date(),`MMMM ????, YYYY @ hh:mm:ss A`).replace("????", getOrdinalNum(new Date().getDate()))
      global.logger.log(`Current date & time is: ${chalk.cyanBright(DaT)}`, returnFileName());
      global.logger.log(`Discord.JS version: ${chalk.yellow(version)}`, returnFileName());
      
      if (global.app.config.development) {
        global.logger.log(`Database name: ${chalk.cyanBright("IRIS_DEVELOPMENT")}`, returnFileName());
        global.logger.log(`Database ${chalk.yellowBright("GAMEDATA")} collection: ${chalk.cyanBright("DEVSRV_GD_" + mainServer.id)}`, returnFileName());
        global.logger.log(`Database ${chalk.yellowBright("USERDATA")} collection: ${chalk.cyanBright("DEVSRV_UD_" + mainServer.id)}`, returnFileName());
        global.logger.log(`Log name: ${chalk.cyanBright(global.logName)}`, returnFileName());
      }
      global.logger.log("------------------------", returnFileName());
      const botUsername = client.user.discriminator != "0" && client.user.discriminator ? client.user.tag : client.user.username
      global.logger.log(`${chalk.blueBright.bold(botUsername)} is ready and is running ${chalk.blueBright.bold(global.app.config.development ? "DEVELOPMENT" : "COMMUNITY")} edition!`, returnFileName());
      global.logger.log("------------------------", returnFileName());

      fullyReady = true;
    });
    async function getFullCMD(interaction: CommandInteraction) {
      let fullCmd = interaction.commandName;
      // turn all passed in arguments into a single string as well
      if ((
        interaction.options as CommandInteractionOptionResolver
      ).getSubcommandGroup(false)) {
        fullCmd += ` ${(interaction.options as CommandInteractionOptionResolver).getSubcommandGroup()}`;
      }
      if ((
        interaction.options as CommandInteractionOptionResolver
      ).getSubcommand(false)) {
        fullCmd += ` ${(interaction.options as CommandInteractionOptionResolver).getSubcommand()}`;
      }

      for (let option of interaction.options.data) {
        if (!option.value) continue;
        fullCmd += ` ${option.name}:${option.value}`;
      }
      return fullCmd.trim();
    }
    async function userAffectedByPermSet(user: GuildMember, permissionSet: any[]) {
      const rolesSorted = Array.from((user.roles as GuildMemberRoleManager).cache.values())
      const roles = rolesSorted.map((r:Role)=>r.id)
      // check if any selector will affect the user, this means: if the user has a role that is in the selector, return true
      // if the user is in the selector, return true
      // if the selector is @everyone, return true


      for (const permission of permissionSet) {
        const id = permission.selector.slice(1)
        if (id == global.app.config.mainServer) return true
        if (permission.selector.startsWith("#")) {
          if (user.guild.channels.cache.has(id)) return true
        } else if (permission.selector.startsWith("&")) {
          if (roles.includes(id)) return true
        } else if (permission.selector.startsWith("@")) {
          if (user.id == id) return true
        }
      }
      return false

    }
    async function analyzePerms (interaction: CommandInteraction, permissions: any[]) {
      if (global.app.owners.includes(interaction.user.id)) return true
      const rolesSorted = Array.from((interaction.member.roles as GuildMemberRoleManager).cache.values()).sort((a:Role,b:Role)=>a.rawPosition-b.rawPosition)
      const roles = rolesSorted.map((r:Role)=>r.id)
      let defaultChannelPermission = true;
      let defaultUserPermission = true;
      const channelPermissions = permissions.filter((p: { selector: string; }) => p.selector.startsWith("#"));
      const rolePermissions = permissions.filter((p: { selector: string; }) => p.selector.startsWith("&"));
      const userPermissions = permissions.filter((p: { selector: string; }) => p.selector.startsWith("@"));
  
      // start with channel permissions
      let containedChannelID = false;
      for (const permission of channelPermissions) {
          const id = permission.selector.slice(1)
          if (id == interaction.channel.id) {
              containedChannelID = true;
              if (!permission.canUse) {
                  return false;
              }
          } else if (id == (BigInt(global.app.config.mainServer) - 1n).toString()) {
              defaultChannelPermission = permission.canUse;
          }
      }
      if (!containedChannelID && !defaultChannelPermission) return false;
      // then user permissions
      let containedUserID = false;
      for (const permission of userPermissions) {
        const id = permission.selector.slice(1);
        if (id == interaction.user.id) {
          containedUserID = true;
          if (!permission.canUse) {
            return false;
          }
        } else if (id == global.app.config.mainServer) {
          defaultUserPermission = permission.canUse;
        }
      }
      if (!containedUserID && !defaultUserPermission) return false;
      let rolePerms={}
      for (const permission of rolePermissions) {
      const id = permission.selector.slice(1);
      rolePerms[id] = permission.canUse
  }
      let finalRoleResult = true
      for (const role of roles) {
          if (Object.keys(rolePerms).includes(role)) {
              finalRoleResult = rolePerms[role]
          } 
      }
      return finalRoleResult
  }
    /* prettier-ignore */
    const getOrdinalNum = (n:number)=> { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
    /* prettier-ignore */
    const DateFormatter = { monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], formatDate: function (e:any, t:any) { var r = this; return t = r.getProperDigits(t, /d+/gi, e.getDate()), t = (t = r.getProperDigits(t, /M+/g, e.getMonth() + 1)).replace(/y+/gi, (function (t:any) { var r = t.length, g = e.getFullYear(); return 2 == r ? (g + "").slice(-2) : 4 == r ? g : t })), t = r.getProperDigits(t, /H+/g, e.getHours()), t = r.getProperDigits(t, /h+/g, r.getHours12(e.getHours())), t = r.getProperDigits(t, /m+/g, e.getMinutes()), t = (t = r.getProperDigits(t, /s+/gi, e.getSeconds())).replace(/a/gi, (function (t:any) { var g = r.getAmPm(e.getHours()); return "A" === t ? g.toUpperCase() : g })), t = r.getFullOr3Letters(t, /d+/gi, r.dayNames, e.getDay()), t = r.getFullOr3Letters(t, /M+/g, r.monthNames, e.getMonth()) }, getProperDigits: function (e:any, t:any, r:any) { return e.replace(t, (function (e:any) { var t = e.length; return 1 == t ? r : 2 == t ? ("0" + r).slice(-2) : e })) }, getHours12: function (e:any) { return (e + 24) % 12 || 12 }, getAmPm: function (e:any) { return e >= 12 ? "pm" : "am" }, getFullOr3Letters: function (e:any, t:any, r:any, g:any) { return e.replace(t, (function (e:any) { var t = e.length; return 3 == t ? r[g].substr(0, 3) : 4 == t ? r[g] : e })) } };
    
    async function checkPermissions(interaction: CommandInteraction, fullCmd: string) {
      const defaultPermission = true

      /*
        Example: "admin iris logs"

        1. Check if "admin iris logs" has a permissions set, and check against it, if user is not allowed, return false else continue
        2. Check if "admin iris" has a permissions set, and check against it, if user is not allowed, return false else continue
        3. Check if "admin" has a permissions set, and check against it, if user is not allowed, return false else continue
        4. return defaultPermission

        You can check if a user passes a permission check by using analyzePerms(interaction, permissionSet)
        You can get the permission set by doing global.app.config.permissions[fullCmd] (fullCmd is the command name, like "admin iris logs", change it appropriately)  
      */

      // admin iris logs
      const fullCmdPermissions = global.app.config.permissions[fullCmd]
      if (fullCmdPermissions) {
        if (await userAffectedByPermSet(interaction.member as GuildMember, fullCmdPermissions))
        return await analyzePerms(interaction, fullCmdPermissions)
      }
      // if comamnd has 2 or more words continue, else return defaultPermission
      const fullCmdSplit = fullCmd.split(" ")
      if (fullCmdSplit.length < 2) return defaultPermission
      
      // admin iris
      fullCmdSplit.pop()
      const fullCmdPermissions2 = global.app.config.permissions[fullCmdSplit.join(" ")]
      if (fullCmdPermissions2) {
        if (await userAffectedByPermSet(interaction.member as GuildMember, fullCmdPermissions2))
        return await analyzePerms(interaction, fullCmdPermissions2)
      }
      // if command has 3 words, continue, else return defaultPermission
      if (fullCmdSplit.length < 2) return defaultPermission 
      
      // admin
      fullCmdSplit.pop()
      const fullCmdPermissions3 = global.app.config.permissions[fullCmdSplit.join(" ")]
      if (fullCmdPermissions3) {
        if (await userAffectedByPermSet(interaction.member as GuildMember, fullCmdPermissions3))
        return await analyzePerms(interaction, fullCmdPermissions3)
      }
      return defaultPermission
    }
    performance.start("logInTime")
    client.login(process.env.TOKEN);
  } catch (e: any) {
    global.logger.log(e, returnFileName());
  }
})();
function returnFileName() {
  return __filename.split(process.platform == "linux" ? "/" : "\\")[ __filename.split(process.platform == "linux" ? "/" : "\\").length - 1 ]
}
