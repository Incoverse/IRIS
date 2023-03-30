const eventInfo = {
  type: "runEvery",
  ms: 60000, //1m 1s, just to avoid accidentally calling a birthday twice
  runImmediately: true,
};
let running = false;
let Discord = require("discord.js");
let moment = require("moment-timezone");
const { MongoClient } = require("mongodb");
/**
 *
 * @param {Discord.Client} client
 * @param {*} RM
 */
async function runEvent(client, RM) {
  running = true;
  // -----------
  for (let birthday of global.birthdays) {
    if (birthday.timezone == null) birthday.timezone = "Europe/London";
    if (
      !isSameDay(
        new Date(birthday.birthday + " 12:00 am UTC"),
        moment(new Date()).tz(birthday.timezone)
      ) &&
      !isSameDay(
        new Date(birthday.birthday + " 12:00 am UTC").setDate(
          new Date(birthday.birthday + " 12:00 am UTC") + 1
        ),
        moment(new Date()).tz(birthday.timezone)
      )
    ) {
      continue;
    }
    const timeInTimezone = moment().tz(birthday.timezone).format("hh:mma");
    let birthdayRole = null;
    if (timeInTimezone == "12:00am") {
      if (
        isSameDay(
          new Date(birthday.birthday + " 12:00 am UTC"),
          moment(new Date()).tz(birthday.timezone)
        )
      ) {
        client.guilds
          .fetch(global.app.config.mainServer)
          .then(async (guild) => {
            await guild.roles.fetch().then((roles) => {
              roles.forEach((role) => {
                if (role.name.toLowerCase().includes("birthday")) {
                  birthdayRole = role;
                }
              });
            });
            /* prettier-ignore */
            global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+returnFileName()+"] ")+ "It's " + global.chalk.yellow((await guild.members.fetch(birthday.id)).user.tag) + "'s "+(birthday.birthday.split(/\W+/g)[0] !== "0000"? global.chalk.yellow(getOrdinalNum(new Date().getUTCFullYear()-new Date(birthday.birthday).getUTCFullYear())) + " ": "")+"birthday! In "+global.chalk.yellow(birthday.timezone)+" it's currently " + global.chalk.yellow(moment(new Date()).tz(birthday.timezone).format("MMMM Do, YYYY @ hh:mm a")) + ".")
            await (
              await guild.members.fetch(birthday.id)
            ).roles.add(birthdayRole);
            guild.channels.fetch().then((channels) => {
              channels.forEach(async (channel) => {
                if (channel.name.includes("general")) {
                  await channel.send(
                    "It's <@" +
                      birthday.id +
                      ">'s " +
                      (birthday.birthday.split(/\W+/g)[0] !== "0000"
                        ? getOrdinalNum(
                            new Date().getUTCFullYear() -
                              new Date(birthday.birthday).getUTCFullYear()
                          ) + " "
                        : "") +
                      "birthday! Happy birthday!" // It's @USER's <ordinal num (17th,12th,etc.)> birthday! Happy birthday!
                  );
                }
              });
            });
          });
      } else {
        client.guilds
          .fetch(global.app.config.mainServer)
          .then(async (guild) => {
            await guild.roles.fetch().then((roles) => {
              roles.forEach((role) => {
                if (role.name.toLowerCase().includes("birthday")) {
                  birthdayRole = role;
                }
              });
            });
            if (
              (await guild.members.fetch(birthday.id)).roles.cache.some(
                (role) => role.id == birthdayRole.id
              )
            ) {
              (await guild.members.fetch(birthday.id)).roles.remove(
                birthdayRole
              );
            }
          });
      }
    }
  }
  // -----------
  running = false;
}
/* prettier-ignore */
function getOrdinalNum(n) { return n + (n > 0 ? ["th", "st", "nd", "rd"][n > 3 && n < 21 || n % 10 > 3 ? 0 : n % 10] : "") }
/**
 *
 * @param {Date} date1
 * @param {moment.Moment} date2
 * @returns
 */
function isSameDay(date1, date2) {
  const day1 = date1.getUTCDate();
  const month1 = date1.getUTCMonth();
  const day2 = date2.date();
  const month2 = date2.month();

  return day1 === day2 && month1 === month2;
}
function eventType() {
  return eventInfo.type;
}
function returnFileName() {
  return __filename.split("/")[__filename.split("/").length - 1];
}
function getMS() {
  return eventInfo.ms;
}
function runImmediately() {
  return eventInfo.runImmediately;
}
module.exports = {
  runEvent,
  returnFileName,
  eventType,
  getMS,
  running,
  runImmediately,
};
