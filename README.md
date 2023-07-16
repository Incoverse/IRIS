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

  <h3 align="center">IRIS</h3>

  <p align="center">
    IRIS (Intelligent Response Interface System) is a Discord bot created by and for the Chaos Crew Community!
    <br />
    <a href="https://github.com/Incoverse/IRIS"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="#about-the-project">View Demo</a>
    ·
    <a href="https://github.com/Incoverse/IRIS/issues">Report Bug</a>
    ·
    <a href="https://github.com/Incoverse/IRIS/issues">Request Feature</a>
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

[![Product Name Screen Shot][product-screenshot]](https://example.com)
INSERT THE VIDEO HERE AND REMOVE THE ABOVE PHOTO

This video shows the process of setting up the bot on your system to test.

Welcome to the official GitHub developers repository for IRIS, a Discord bot developed and refined by the vibrant and passionate Chaos Crew Discord community. IRIS stands for Intelligent Response Interface System, and it is designed to revolutionize your Discord experience. IRIS brings a new level of interactivity, functionality, and fun to the Chaos Crew server.:smile:

The development of IRIS is a collaborative effort, driven by the collective wisdom and expertise of the chaos crew. This repository serves as a central hub for contributors, where ideas are shared, code is written, and issues are resolved. 

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

There are many frameworks/libraries used to create this project. Here are a few examples.

* [![Discord][Discord.js]][Discord-url]
* [![.ENV][dotenv]][dotenv-url]
* [![Express][express]][express-url]
* [![MongoDB][MongoDB]][MongoDB-url]
* [![chalk][chalk]][chalk-url]


<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

* [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
* [VSCode](https://code.visualstudio.com/download)
* [MongoDB Compass](https://www.mongodb.com/try/download/compass)
* [Node.JS](https://nodejs.org/en) (19.9.0 (latest one has bugs)) 

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/Incoverse/IRIS
   ```
2. Install NPM typescript packages
   ```sh
   npm i -g typescript
   ```
3. Navigate to the project directory
4. Customize `config.jsonc` to your needs, check comments for guidance. Modify the developmentServer with your test server id
5. Install any missing packages
   ```
   npm i
   ```
6. Create your discord bot.
   * Create a new Discord Application [Here](https://discord.com/developers/applications)
   * Go to the OAuth2 section and note down your client ID and secret
   * Staying on the same page, add a redirect URL `http://localhost:7380` (discord may add a / at the end, be sure to remove it) 
   * Go to the Bot section and turn on all intents and note down your bot token
7. Add your `.env` file in the root directory and replace the bot token, client ID, client Secret
   ```
   TOKEN="BOT.TOKEN.HERE"
   DBUSERNAME="irisdev"
   DBPASSWD="UQyOxR19Egua3iW0Bi75ORIb2dn6yGT6Cs9ITRbwUK37ADpCyV"
   DEVELOPMENT="YES"
   cID="[client-id]"
   cSecret="[client-secret]"
   ```   
9. Now it's time to add your bot to your server. Use the following URL, but replace "[client-id] with the client-id from earlier: https://discord.com/api/oauth2/authorize?client_id=[client-id]&permissions=328866327553&scope=bot%20applications.commands 
11. Follow <a href="#server-creation-notes">Server Creation Notes</a>
12. Type in `npm run CnR` in your cmd/terminal (CnR = Compile & Run)
13. Click the link generated in the console to authorize the bot. it should be in this format `https://discord.com/oauth2/authorize?client_id=[client ID]&redirect_uri=http://localhost:7380&response_type=code&scope=applications.commands.permissions.update`



<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- Server Creation Notes -->
## Server Creation Notes

You can skip this by using the following server template: https://discord.new/PTqAeyCChkYW

The following channels are required for IRIS to function as intended: `birthdays`, `open-a-ticket`.
The following roles are required for IRIS to function as intended: `New Member`, `It's my birthday!`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

To gather the logs for debugging 
   ```
   /admin iris logs
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply post an idea in the ideas section on Discord with the proper tags.

1. Fork the repo
  - [Create a fork](https://docs.github.com/en/get-started/quickstart/fork-a-repo) of this repo
2. Clone the fork to local
   ```sh
   git clone https://github.com/your_username/IRIS
   ```
3. Continue from step 2 in <a href="#installation">Installation</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the  GPL-3.0 license. See [LICENSE](https://github.com/Incoverse/IRIS/blob/main/LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Contact Inimi if you have any questions or need help with something. For additional, help you can open a ticket on the server.

<p align="right">(<a href="#readme-top">back to top</a>)</p>


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
