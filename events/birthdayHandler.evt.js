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
  // console.log(global.birthdays)
  for (let birthday of JSON.parse(JSON.stringify(global.birthdays))) {
    if (birthday.timezone == null) birthday.timezone = "Europe/London";
    if (birthday.passed) {
      const dSB = howManyDaysSinceBirthday(
        birthday.birthday,
        birthday.timezone
      );
      if (dSB >= 1) {
        client.guilds
          .fetch(global.app.config.mainServer)
          .then(async (guild) => {
            await guild.roles.fetch().then((roles) => {
              roles.every(async (role) => {
                if (role.name.toLowerCase().includes("birthday")) {
                  if (role.members.some((m) => m.id == birthday.id)) {
                    await (
                      await guild.members.fetch(birthday.id)
                    ).roles.remove(role);
                  }
                  return false; //! stop .every()
                }
              });
            });
          });
      }
      if (dSB >= 2) {
        //! Cannot timezone clip into new birthday
        const dbclient = new MongoClient(global.mongoConnectionString);
        try {
          let db = dbclient.db("IRIS");
          let userdata = db.collection(
            global.app.config.development ? "userdata_dev" : "userdata"
          );
          await userdata.updateOne(
            { id: birthday.id },
            {
              $set: {
                birthdayPassed: false,
              },
            }
          );
          let bd = global.birthdays.find((bd) => bd.id === birthday.id);
          bd.passed = false;
          let copy = global.birthdays.filter((obj) => obj.id !== birthday.id);
          copy.push(bd);
          global.birthdays = copy;
        } finally {
          await dbclient.close();
        }
      }

      continue;
    }
    if (
      !isSameDay(
        moment.tz(birthday.timezone),
        moment.tz(birthday.birthday, birthday.timezone)
      )
    ) {
      continue;
    }
    const timeInTimezone = moment.tz(birthday.timezone).format("hh:mma");
    let birthdayRole = null;
    if (timeInTimezone == "12:00am") {
      client.guilds.fetch(global.app.config.mainServer).then(async (guild) => {
        await guild.roles.fetch().then((roles) => {
          roles.forEach((role) => {
            if (role.name.toLowerCase().includes("birthday")) {
              birthdayRole = role;
            }
          });
        });
        /* prettier-ignore */
        global.app.debugLog(chalk.white.bold("["+moment().format("M/D/y HH:mm:ss")+"] ["+module.exports.returnFileName()+"] ")+ "It's " + global.chalk.yellow((await guild.members.fetch(birthday.id)).user.tag) + "'s "+(birthday.birthday.split(/\W+/g)[0] !== "0000"? global.chalk.yellow(getOrdinalNum(new Date().getUTCFullYear()-new Date(birthday.birthday).getUTCFullYear())) + " ": "")+"birthday! In "+global.chalk.yellow(birthday.timezone)+" it's currently " + global.chalk.yellow(moment(new Date()).tz(birthday.timezone).format("MMMM Do, YYYY @ hh:mm a")) + ".")
        await (await guild.members.fetch(birthday.id)).roles.add(birthdayRole);
        guild.channels.fetch().then((channels) => {
          channels.every(async (channel) => {
            if (channel.name.includes("birthdays")) {
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
              return false;
            }
          });
        });
        const dbclient = new MongoClient(global.mongoConnectionString);
        try {
          let db = dbclient.db("IRIS");
          let userdata = db.collection(
            global.app.config.development ? "userdata_dev" : "userdata"
          );
          await userdata.updateOne(
            { id: birthday.id },
            {
              $set: {
                birthdayPassed: true,
              },
            }
          );
          let bd = global.birthdays.find((bd) => bd.id === birthday.id);
          bd.passed = true;
          let copy = global.birthdays.filter((obj) => obj.id !== birthday.id);
          copy.push(bd);
          global.birthdays = copy;
        } finally {
          await dbclient.close();
        }
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
  const day1 = date1.date();
  const month1 = date1.month();
  const day2 = date2.date();
  const month2 = date2.month();
  return day1 === day2 && month1 === month2;
}
function howManyDaysSinceBirthday(birthday, timezone) {
  return Math.floor(
    moment
      .tz(timezone)
      .diff(moment.tz(birthday, timezone).year(moment.tz(timezone).year())) /
      (24 * 60 * 60 * 1000)
  );
}

module.exports = {
  runEvent,
  returnFileName: () => __filename.split("/")[__filename.split("/").length - 1],
  eventType: () => eventInfo.type,
  priority: () => 0,
  getMS: () => eventInfo.ms,
  running,
  runImmediately: () => eventInfo.runImmediately,
};
