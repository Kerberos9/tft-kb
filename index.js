const { Client, Intents } = require('discord.js');

const getUserStats = require('./commands/stats.js');
require('dotenv').config();
const bot = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
const prefix = 'tft!';

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}`);
});

bot.on('messageCreate', async msg => {
    if (!msg.content.startsWith(prefix)) return;

    const username = msg.content.slice(prefix.length);
    getUserStats(msg, username);
    console.log(`Message received!: ${msg.content}\nUsername: ${username}
    `);
});

bot.login(process.env.TOKEN);
