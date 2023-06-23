# IRIS
IRIS (Intelligent Response Interface System) is a Discord bot created by and for the Chaos Crew Community.


## Information for the members of the Development Team

### Setup
First of all, make an application on [Discord's Developer Page](https://discord.com/developers/applications). Turn that application into a bot and note down the token, client ID and client secret. After you have done that, make sure all intents are checked. Now it's time to add your bot to your server. Use the following URL, but replace "[client-id] with the client-id from earlier: https://discord.com/api/oauth2/authorize?client_id=[client-id]&permissions=328866327553&scope=bot%20applications.commands.

In the .env file you were provided with, add:
- ``cID="[client-id]"``
- ``cSecret="[client-secret]"``
  
And of course, replace "BOT.TOKEN.HERE" with your bot token.

### Steps
1. Make sure you have Node.JS (19.9.0 (latest one has bugs)) installed.
2. Open cmd/terminal
3. Type in ``npm i -g typescript``
4. Navigate to the project directory
5. Customize `config.jsonc` to your needs, check comments for guidance.
6. Follow "Server creation notes" below
7. Type in ``npm run CnR`` in your cmd/terminal (CnR = Compile & Run)

On the first start up, you will have a Discord link that you need to authorize so that IRIS can set command permissions and visibility. (The account that is authorizing has to be able to see the "integrations" tab in server settings as well as be able to change permissions for slash commands on the development server.



### Server creation notes
#### You can skip this by using the following server template: https://discord.new/PTqAeyCChkYW

The following channels are required for IRIS to function as intended: ``birthdays``, ``open-a-ticket``.<br>
The following roles are required for IRIS to function as intended: ``New Member``, ``It's my birthday!``.

Contact Inimi if you have any questions or need help with something.
