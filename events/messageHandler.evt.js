const commandInfo = {
  type: "onMessage",
};

let Discord = require("discord.js");
/**
 *
 * @param {Discord.Message} message
 * @param {*} RM
 */
async function runEvent(message, RM) {}
function eventType() {
  return commandInfo.type;
}
module.exports = {
  runEvent,
  eventType,
};
