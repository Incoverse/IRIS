/*
 * Copyright (c) 2023 Inimi | InimicalPart | InCo
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

import Discord, {
  CommandInteractionOptionResolver,
  GuildMemberRoleManager,
  Team,
} from "discord.js";
import { IRISGlobal } from "../interfaces/global.js";
import { fileURLToPath } from "url";
import { promisify } from "util";
import { exec } from "child_process";
import { MongoClient } from "mongodb";
import { existsSync } from "fs";
import moment from "moment-timezone";
import chalk from "chalk";
import prettyMilliseconds from "pretty-ms";
declare const global: IRISGlobal;
const __filename = fileURLToPath(import.meta.url);
const commandInfo = {
  category: "fun/music/mod/misc/economy",
  slashCommand: new Discord.SlashCommandBuilder()
  .setName("admin")
    .setDescription("Admin Commands")
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("edit")
        .setDescription("Commands to manage user's information in the database")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("birthday")
            .setDescription("Edit/get a user's birthday")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user whose birthday you want to edit")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("birthday")
                .setDescription(
                  "The new birthday of the user (Format: YYYY-MM-DD), or 'null' to remove the birthday"
                )
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("timezone")
            .setDescription("Edit/get a user's timezone")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user whose timezone you want to edit")
                .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("timezone")
                .setDescription(
                  "The new timezone of the user (Format: Region/City), or 'null' to remove the timezone"
                )
            )
        )
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("system")
        .setDescription("Commands to manage the system")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("resetcert")
            .setDescription("Force a reset of the certificate for MongoDB.")
        )

        .addSubcommand((subcommand) =>
          subcommand
            .setName("restartmongo")
            .setDescription("Force a restart of MongoDB.")
        )
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("iris")
        .setDescription("Commands to manage IRIS")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("restart")
            .setDescription("Force a restart of IRIS.")
        )
        .addSubcommand((subcommand) =>
          subcommand.setName("stop").setDescription("Force-stop IRIS.")
          )
    )

    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName("entry")
        .setDescription("Commands to manage the database entries")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("delete")
            .setDescription("Delete a user's entry from the database")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user whose entry you want to delete")
                .setRequired(true)
                )
                )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("get")
            .setDescription("Get a user's entry from the database")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("The user whose entry you want to delete")
                .setRequired(true)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("create")
            .setDescription("Create a new entry in the database")
            .addUserOption((option) =>
              option
              .setName("user")
              .setDescription("The user whose entry you want to create")
              .setRequired(true)
            )
            .addStringOption((option) =>
              option
                .setName("birthday")
                .setDescription("The birthday of the user (Format: YYYY-MM-DD)")
            )
            .addStringOption((option) =>
              option
                .setName("timezone")
                .setDescription(
                  "The timezone of the user (Format: Region/City)"
                )
            )
        )
    )

    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageMessages), // just so normal people dont see the command
    settings: {
      devOnly: false
    },
  };
  const execPromise = promisify(exec);
  export async function runCommand(
    interaction: Discord.CommandInteraction,
  RM: object
) {
  try {
    const adminPermissions = global.app.config.permissions.admin;
    /*
        * Check if the user has the required permissions to use this command

        * Get the allowed roles from the config file, if the bot is in development mode, use the development roles, else use the main roles
        * If the development roles are null, use the main roles
    */
    const AllowedRoles =
      process.env.DEVELOPMENT == "YES"
        ? adminPermissions.development == null
          ? adminPermissions.main
          : adminPermissions.development
        : adminPermissions.main;
    if (
      !(interaction.member.roles as GuildMemberRoleManager).cache.some((role) =>
        AllowedRoles.includes(role.name.toLowerCase())
      )
    ) {
      await interaction.reply({
        content: "You don't have permission to use this command!",
        ephemeral: true,
      });
      return;
    }
    const subcommandGroup = (
      interaction.options as CommandInteractionOptionResolver
    ).getSubcommandGroup(true);
    const subcommand = (
      interaction.options as CommandInteractionOptionResolver
    ).getSubcommand(true);

    if (subcommandGroup == "entry") {
      if (subcommand == "get") {
        const user = (
          interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);

        if (user.bot) {
          await interaction.reply({
            content:
              "This user is a bot and cannot have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
        const client = new MongoClient(global.mongoConnectionString);

        const collection = client
          .db("IRIS")
          .collection(
            global.app.config.development ? "userdata_dev" : "userdata"
          );
        const result = await collection.findOne({ id: user.id });
        client.close();
        if (result == null) {
          await interaction.reply({
            content: "This user does not have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
        delete result._id;
        await interaction.reply({
          content: "```json\n" + JSON.stringify(result, null, 2) + "```",
          ephemeral: true,
          allowedMentions: { parse: [] },
        });
      } else if (subcommand == "create") {
        const user = (
          interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);
        const birthday = (
          interaction.options as CommandInteractionOptionResolver
        ).getString("birthday");
        let timezone = (
          interaction.options as CommandInteractionOptionResolver
        ).getString("timezone");

        if (user.bot) {
          await interaction.reply({
            content:
              "This user is a bot and cannot have an entry in the database!",
            ephemeral: true,
          });
          return;
        }

        const client = new MongoClient(global.mongoConnectionString);

        const collection = client
          .db("IRIS")
          .collection(
            global.app.config.development ? "userdata_dev" : "userdata"
          );

        // Check if the user already has an entry in the database
        const result = await collection.findOne({ id: user.id });
        if (result != null) {
          client.close()
          await interaction.reply({
            content: "This user already has an entry in the database!",
            ephemeral: true,
          });
          return;
        }

        const entry = {
          ...global.app.config.defaultEntry,
          ...{
            id: user.id,
            discriminator: user.discriminator,
            username: user.username,
          },
        };
        if (birthday != null) {
          entry.birthday = birthday;
        }
        if (timezone != null) {
          timezone =
            moment.tz.names()[
              moment.tz
                .names()
                .map((a) => a.toLowerCase())
                .indexOf(timezone.toLowerCase())
            ];
          if (!timezone) {
            await interaction.reply({
              content:
                "This timezone is invalid! Please use the format: Region/City. You can find all valid timezones here: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List",
              ephemeral: true,
            });
            return;
          }
          entry.approximatedTimezone = timezone;
          entry.timezones.push(timezone);
        }

        await collection.insertOne(entry);
        client.close();
        delete entry._id;
        await interaction.reply({
          content:
            "Entry successfully created for **" +
            user.username +
            ":**" +
            "```json\n" +
            JSON.stringify(entry, null, 2) +
            "```",
          ephemeral: true,
          allowedMentions: { parse: [] },
        });
      } else if (subcommand == "delete") {
        const user = (
          interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);
        const client = new MongoClient(global.mongoConnectionString);

        const collection = client
          .db("IRIS")
          .collection(
            global.app.config.development ? "userdata_dev" : "userdata"
          );
        /*
         * Here we do not check if the user is a bot, because if a bot entry is accidentally created, it should be able to be deleted.
         */
        const result = await collection.findOneAndDelete({ id: user.id });
        await interaction.reply({
          content:
            result.value != null
              ? "**" +
                user.username +
                (user.username.endsWith("s") ? "'" : "'s") +
                "** entry has been successfully deleted."
              : "This user does not have an entry in the database!",
          ephemeral: true,
        });
        client.close();
      }
    } else if (subcommandGroup == "edit") {
      if (subcommand == "timezone") {
        const user = (
          interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);
        let timezone = (
          interaction.options as CommandInteractionOptionResolver
        ).getString("timezone");

        /*

          You are now to edit the timezone of a user.
          use 'new MongoCLient(global.mongoConnectionString)' to create a new client. The database name is 'IRIS' and the collection name is 'userdata_dev' if the bot is in development mode, else it is 'userdata'
          use 'client.db("IRIS").collection(global.app.config.development ? "userdata_dev" : "userdata")' to get the collection
          use 'collection.findOneAndUpdate({ id: user.id }, { $set: { approximatedTimezone: timezone, timezones: [timezone] } })' to update the entry
          but if the command is specified without a timezone argument (the timezone argument will be null), then just get the timezone of the user and reply with it.
          but if the timezone argument is "null" (in a string), then delete the timezone from the entry. by setting approximatedTimezone to null and timezones to an empty array.
          then close the client with 'client.close()'
         */

        const client = new MongoClient(global.mongoConnectionString);
        const collection = client
          .db("IRIS")
          .collection(
            global.app.config.development ? "userdata_dev" : "userdata"
          );
        if (timezone == null) {
          const result = await collection.findOne({ id: user.id });
          client.close();
          if (result == null) {
            await interaction.reply({
              content: "This user does not have an entry in the database!",
              ephemeral: true,
            });
            return;
          }
          await interaction.reply({
            content:
              user.username +
              (user.username.endsWith("s") ? "'" : "'s") +
              " timezone is **" +
              result.approximatedTimezone +
              "**",
            ephemeral: true,
          });
          return;
        } else if (timezone == "null") {
          const result = await collection.findOneAndUpdate(
            { id: user.id },
            { $set: { approximatedTimezone: null, timezones: [] } }
          );
          client.close();
          if (result.value == null) {
            await interaction.reply({
              content: "This user does not have an entry in the database!",
              ephemeral: true,
            });
            return;
          }
          await interaction.reply({
            content:
              user.username +
              (user.username.endsWith("s") ? "'" : "'s") +
              " timezone has been successfully cleared.",
            ephemeral: true,
          });
          return;
        } else {
          timezone =
            moment.tz.names()[
              moment.tz
                .names()
                .map((a) => a.toLowerCase())
                .indexOf(timezone.toLowerCase())
            ];
          if (!timezone) {
            client.close()
            await interaction.reply({
              content:
                "This timezone is invalid! Please use the format: Region/City. You can find all valid timezones here: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List",
              ephemeral: true,
            });
            return;
          }
          const result = await collection.findOneAndUpdate(
            { id: user.id },
            { $set: { approximatedTimezone: timezone, timezones: [timezone] } }
          );
          client.close();
          if (result.value == null) {
            await interaction.reply({
              content: "This user does not have an entry in the database!",
              ephemeral: true,
            });
            return;
          }
          await interaction.reply({
            content:
              user.username +
              (user.username.endsWith("s") ? "'" : "'s") +
              " timezone has been successfully set to **" +
              timezone +
              "**.",
            ephemeral: true,
          });
          return;
        }
      } else if (subcommand == "birthday") {
        const user = (
          interaction.options as CommandInteractionOptionResolver
        ).getUser("user", true);
        let birthday = (
          interaction.options as CommandInteractionOptionResolver
        ).getString("birthday");

        if (birthday == "null") {
          const client = new MongoClient(global.mongoConnectionString);
          const collection = client
            .db("IRIS")
            .collection(
              global.app.config.development ? "userdata_dev" : "userdata"
            );
          const rresult = await collection.findOneAndUpdate(
            { id: user.id },
            { $set: { birthday: null } }
          );
          client.close();
          if (rresult.value == null) {
            await interaction.reply({
              content: "This user does not have an entry in the database!",
              ephemeral: true,
            });
            return;
          } else {
            await interaction.reply({
              content:
                user.username +
                (user.username.endsWith("s") ? "'" : "'s") +
                " birthday has been successfully cleared.",
              ephemeral: true,
            });
            return;
          }
        }
        let hasQuestionMarks = false;

        if (birthday.includes("????")) {
          hasQuestionMarks = true;
          birthday = birthday.replace("????", "0000");
        }
        if (birthday.includes("?")) {
          // user put ? in the months/days or as a separator
          await interaction.reply({
            content:
              "Invalid date! Please provide the date in a YYYY-MM-DD format",
            ephemeral: true,
          });
          return;
        }
        const match = birthday.match(/[0-9]{4}-[0-9]{2}-[0-9]{2}/);
        if (match) {
          birthday = match[0];
        } else {
          // yyyy-mm-dd format not found
          await interaction.reply({
            content:
              "Invalid date! Please provide the date in a YYYY-MM-DD format",
            ephemeral: true,
          });
          return;
        }
        if (new Date(birthday).toString() == "Invalid Date") {
          await interaction.reply({
            content:
              "Invalid date! Please provide the date in a YYYY-MM-DD format",
            ephemeral: true,
          });
          return;
        }
        if (
          new Date(birthday).getUTCFullYear() <
            new Date().getUTCFullYear() - 100 &&
          hasQuestionMarks == false
        ) {
          await interaction.reply({
            content: "Invalid date!",
            ephemeral: true,
          });
          return;
        }
        if (new Date() < new Date(birthday)) {
          // date is in the future
          await interaction.reply({
            content: "The date you have provided is in the future!",
            ephemeral: true,
          });
          return;
        }
        const client = new MongoClient(global.mongoConnectionString);
        const collection = client
          .db("IRIS")
          .collection(
            global.app.config.development ? "userdata_dev" : "userdata"
          );

        const result = await collection.findOneAndUpdate(
          { id: user.id },
          { $set: { birthday: birthday } }
        );
        client.close();
        if (result.value == null) {
          await interaction.reply({
            content: "This user does not have an entry in the database!",
            ephemeral: true,
          });
          return;
        }
        await interaction.reply({
          content:
            user.username +
            (user.username.endsWith("s") ? "'" : "'s") +
            " birthday has been successfully set to **" +
            DateFormatter.formatDate(
              new Date(birthday),
              hasQuestionMarks ? `MMMM ????` : `MMMM ????, YYYY`
            ).replace("????", getOrdinalNum(new Date(birthday).getDate())) +
            "**.",
          ephemeral: true,
        });
      }
    } else if (subcommandGroup == "system") {
      if (subcommand == "resetcert") {
        if (process.platform !== "linux") {
          return interaction.reply(
            "This command is disabled as this instance of IRIS is running on a " +
              process.platform.toUpperCase() +
              " system when we're expecting LINUX."
          );
        } else {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.yellow(interaction.user.tag)+" replaced the MongoDB certificate.");
          interaction.deferReply();
          let beforeChange,
            output = null;
          try {
            beforeChange = await execPromise(
              "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
            );
            await execPromise("sudo /root/resetcert.sh 0");
            output = await execPromise(
              "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
            );
          } catch (e) {
            await execPromise("sudo /root/resetcert.sh 0");
            await sleep(1500);
            let fullchainexists = existsSync("/etc/ssl/IRIS/fullchain.pem");
            let mongodpemexists = existsSync("/etc/ssl/IRIS/mongod.pem");
            if (fullchainexists && mongodpemexists) {
              output = await execPromise(
                "openssl x509 -enddate -noout -in /etc/ssl/IRIS/fullchain.pem"
              );
              interaction.editReply(
                "Something errored for a second, I have gotten back the files now, The certificate expires in: ``" +
                  prettyMilliseconds(
                    new Date(output.stdout.trim().split("=")[1]).getTime() -
                      new Date().getTime()
                  ) +
                  "`` (``" +
                  output.stdout.trim().split("=")[1] +
                  "``)"
              );
              return;
            } else {
              interaction.editReply(
                "Some files are missing!!\n" +
                  (fullchainexists
                    ? "fullchain.pem exists"
                    : "fullchain.pem missing!") +
                  (fullchainexists && mongodpemexists ? "\n" : "") +
                  (mongodpemexists
                    ? "mongod.pem exists"
                    : "mongod.pem missing!")
              );
              return;
            }
          }
          if (output.stdout == beforeChange.stdout) {
            /* prettier-ignore */
            global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+"Certificate not changed, reason: No new certificate is available. This certificate expires in: " + chalk.yellow(output.stdout));
            interaction.editReply(
              "No new certificate is available. This certificate expires in: ``" +
                prettyMilliseconds(
                  new Date(output.stdout.trim().split("=")[1]).getTime() -
                    new Date().getTime()
                ) +
                "`` (``" +
                output.stdout.trim().split("=")[1] +
                "``)"
            );
          } else {
            /* prettier-ignore */
            global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+"Certificate successfully replaced. Expires in: " + chalk.yellow(output.stdout));
            interaction.editReply(
              "The certificate has been successfully replaced. This certificate expires in: ``" +
                prettyMilliseconds(
                  new Date(output.stdout.trim().split("=")[1]).getTime() -
                    new Date().getTime()
                ) +
                "`` (``" +
                output.stdout.trim().split("=")[1] +
                "``)"
            );
          }
        }
      } else if (subcommand == "restartMongo") {
        if (process.platform !== "linux") {
          return interaction.reply(
            "This command is disabled as this instance of IRIS is running on a " +
              process.platform.toUpperCase() +
              " system when we're expecting LINUX."
          );
        } else {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.yellow(interaction.user.tag)+" has restarted MongoDB.");

          interaction.deferReply();
          await execPromise("sudo systemctl restart mongod");
          await sleep(1500);
          try {
            await execPromise(
              "sudo systemctl status mongod | grep 'active (running)' "
            );
          } catch (e) {
            /* prettier-ignore */
            global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.red("MongoDB failed to start!"));
            interaction.editReply(
              "⚠️ MongoDB has been restarted, but is not running due to a failure."
            );
            return;
          }
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.greenBright("MongoDB successfully started back up!"));
          interaction.editReply(
            ":white_check_mark: MongoDB has been restarted successfully."
          );
        }
      }
    } else if (subcommandGroup == "iris") {
      if (subcommand == "restart") {
        if (process.platform !== "linux") {
          return interaction.reply(
            "This command is disabled as this instance of IRIS is running on a " +
              process.platform.toUpperCase() +
              " system when we're expecting LINUX."
          );
        } else {
          /* prettier-ignore */
          global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.yellow(interaction.user.tag)+" has restarted IRIS.");

          await interaction.reply({
            content: "IRIS is now restarting...",
          });
          execPromise("sudo systemctl restart IRIS");
        }
      } else if (subcommand == "stop") {
        /* prettier-ignore */
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+chalk.yellow(interaction.user.tag)+" has stopped IRIS.");

        await interaction.reply({
          content: "IRIS is now stopping...",
        });
        if (global.app.config.development) {
          process.exit(0);
        } else {
          execPromise("sudo systemctl stop IRIS");
        }
      }
    }
  } catch (e) {
    await interaction.client.application.fetch();
    console.error(e);
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
/* prettier-ignore */
function getOrdinalNum(n) { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
/* prettier-ignore */
const DateFormatter = { monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], formatDate: function (e, t) { var r = this; return t = r.getProperDigits(t, /d+/gi, e.getDate()), t = (t = r.getProperDigits(t, /M+/g, e.getMonth() + 1)).replace(/y+/gi, (function (t) { var r = t.length, g = e.getFullYear(); return 2 == r ? (g + "").slice(-2) : 4 == r ? g : t })), t = r.getProperDigits(t, /H+/g, e.getHours()), t = r.getProperDigits(t, /h+/g, r.getHours12(e.getHours())), t = r.getProperDigits(t, /m+/g, e.getMinutes()), t = (t = r.getProperDigits(t, /s+/gi, e.getSeconds())).replace(/a/gi, (function (t) { var g = r.getAmPm(e.getHours()); return "A" === t ? g.toUpperCase() : g })), t = r.getFullOr3Letters(t, /d+/gi, r.dayNames, e.getDay()), t = r.getFullOr3Letters(t, /M+/g, r.monthNames, e.getMonth()) }, getProperDigits: function (e, t, r) { return e.replace(t, (function (e) { var t = e.length; return 1 == t ? r : 2 == t ? ("0" + r).slice(-2) : e })) }, getHours12: function (e) { return (e + 24) % 12 || 12 }, getAmPm: function (e) { return e >= 12 ? "pm" : "am" }, getFullOr3Letters: function (e, t, r, g) { return e.replace(t, (function (e) { var t = e.length; return 3 == t ? r[g].substr(0, 3) : 4 == t ? r[g] : e })) } };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const returnFileName = () =>
  __filename.split(process.platform == "linux" ? "/" : "\\")[
    __filename.split(process.platform == "linux" ? "/" : "\\").length - 1
  ];
export const getSlashCommand = () => commandInfo.slashCommand;
export const commandCategory = () => commandInfo.category;
export const commandSettings = () => commandInfo.settings;
