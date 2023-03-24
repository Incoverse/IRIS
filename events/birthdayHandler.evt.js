const commandInfo = {
  type: "runEvery",
  ms: 60000, //1m 1s, just to avoid accidentally calling a birthday twice
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
      )
    ) {
      continue;
    }
    const timeInTimezone = moment().tz(birthday.timezone).format("hh:mma");
    if (timeInTimezone == "12:00am") {
      client.guilds.fetch(global.app.mainGuild).then((guild) => {
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
  return commandInfo.type;
}
function getMS() {
  return commandInfo.ms;
}
module.exports = {
  runEvent,
  eventType,
  getMS,
  running,
};
