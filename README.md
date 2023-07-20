<a name="readme-top"></a>
<!--
*** This is the readme for the IRIS bot.
-->



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Incoverse/IRIS">
    <img src="https://i.imgur.com/fZa7QZ4.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">IRIS (Intelligent Response Interface System)</h3>

  <p align="center">
    IRIS is a Discord bot created by and for the Chaos Crew Community!
    <br />
    <hr>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#server-creation-notes">Server Creation Notes</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project



Welcome to the official repository for IRIS, a Discord Bot developed by and for the Kennevo's Chaos Crew community. IRIS stands for Intelligent Response Interface System, and was designed to simplify automation as well as bring fun to the Chaos Crew community.

IRIS is coded from scratch and with :heart: by the Development Team. 



### Built With

There are many frameworks/libraries used to create this project. Here are a few examples.

* [![Discord][Discord.js]][Discord-url]
* [![.ENV][dotenv]][dotenv-url]
* [![Express][express]][express-url]
* [![MongoDB][MongoDB]][MongoDB-url]
* [![chalk][chalk]][chalk-url]


<p align="right">(<a href="#readme-top">Go to the top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

Follow these steps to get a copy of IRIS up and running on your machine!

### Prerequisites

* [Node.JS](https://nodejs.org/en) (19.9.0 (latest one has bugs)) 
* [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [VSCode](https://code.visualstudio.com/download) (optional)
* [MongoDB Compass](https://www.mongodb.com/try/download/compass) (optional)

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/Incoverse/IRIS
   ```
2. Navigate to the project directory
   ```sh
   cd IRIS
   ```
4. Install TypeScript using npm
   ```sh
   npm i -g typescript
   ```
5. Customize `config.jsonc` to your needs, check comments for guidance. Modify the `developmentServer` field with your test server ID
6. Install any missing packages
   ```
   npm install
   ```
   
7. Create your discord bot.
   * [Create a new Discord Application](https://discord.com/developers/applications)
   * Go to the `OAuth2` section and write down your client ID and secret
   * Staying on the same page, add the following redirect URI `http://localhost:7380` (Discord may add a slash at the end, make sure to remove it) 
   * Go to the `Bot` section and turn on all of the intents and write down your bot token (click 'Reset Token' to create the token)
8. Create a `.env` file in the project's root directory and replace the following values to the ones you've written down: `[bot-token]`, `[client-id]`, `[client-secret]`. Leave the rest as it is.
   ```
   TOKEN="[bot-token]"
   DBUSERNAME="irisdev"
   DBPASSWD="UQyOxR19Egua3iW0Bi75ORIb2dn6yGT6Cs9ITRbwUK37ADpCyV"
   DEVELOPMENT="YES"
   cID="[client-id]"
   cSecret="[client-secret]"
   ```   
9. Now it's time to add your bot to your server. Use the following URL, but replace `[client-id]` with the client ID you wrote down: https://discord.com/api/oauth2/authorize?client_id=[client-id]&permissions=328866327553&scope=bot%20applications.commands 
11. Follow <a href="#server-creation-notes">Server Creation Notes</a> to create your server.
12. Write `npm run CnR` in your cmd/terminal (CnR = Compile & Run) and click Enter.
13. When a link is displayed in the console, open it in your browser and authorize it. This will allow IRIS to properly set up command permissions (defined in `config.jsonc`).





<!-- Server Creation Notes -->
## Server Creation Notes

> **Note**: You can skip this by using the following server template: https://discord.new/b4vRrmwJB5kG 
---

The following channels are required for IRIS to function as intended: `birthdays`, `open-a-ticket`.

The following roles are required for IRIS to function as intended: `New Member`, `It's my birthday!`.




<!-- USAGE EXAMPLES -->
## Usage

#### Get debugging logs
   ```
   /admin iris logs
   ```

<p align="right">(<a href="#readme-top">Go to the top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

1. [Create a fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) of this repository
3. Clone the fork
   ```sh
   git clone https://github.com/YOUR_USERNAME/IRIS
   ```
4. Continue from step 3 in <a href="#installation">Installation</a>





<!-- LICENSE -->
## License

Distributed under the GPL-3.0 license. See [LICENSE](https://github.com/Incoverse/IRIS/blob/main/LICENSE) for more information.




<!-- CONTACT -->
## Contact

For any questions or concerns, don't hesitate to contact Inimi ([@theinimi](https://discord.inimicalpart.com)) on Discord or open a ticket in [Kennevo's server](https://discord.gg/WfesBJAYYd).

<hr>

<p align="center">(<a href="#readme-top">Go to the top</a>)</p>


<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[product-screenshot]: https://i.imgur.com/0Lp1rhn.png
[Discord.js]: https://img.shields.io/badge/-DiscordJS-5865F2?logo=Discord&logoColor=white
[Discord-url]: https://discord.js.org/
[dotenv]: https://img.shields.io/badge/-.ENV-ECD53F?logo=.env&logoColor=white
[dotenv-url]: https://www.dotenv.org/
[express]: https://img.shields.io/badge/-Express-000000?logo=Express&logoColor=white
[express-url]: https://expressjs.com/
[MongoDB]: https://img.shields.io/badge/-MongoDB-47A248?logo=MongoDB&logoColor=white
[MongoDB-url]: https://www.mongodb.com/
[chalk]: https://img.shields.io/badge/-chalk-CB3837?logo=npm&logoColor=white
[chalk-url]: https://www.npmjs.com/package/chalk
