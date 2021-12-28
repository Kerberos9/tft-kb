const { Client, Intents } = require('discord.js');
const keepAlive = require('./server');
const getUserStats = require('./commands/stats.js');
require('dotenv').config();
const bot = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});
const prefix = process.env.BOT_PREFIX;

bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}`);
});

bot.on('messageCreate', async msg => {
    if (!msg.content.startsWith(prefix)) return;

    const message = msg.content.slice(prefix.length).split('-');
    const username = message[0];
    const region = message[1] || 'euw';

    getUserStats(msg, username, region);
    console.log(`Message received!: ${msg.content}\nUsername: ${username}\nRegion: ${region}
    `);
});
keepAlive();
bot.login(process.env.TOKEN);
