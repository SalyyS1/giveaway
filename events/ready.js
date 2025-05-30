const { REST, Routes } = require('discord.js');
const fs = require('fs');
const { initializeGiveaways } = require('../utils/giveawayManager');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot is ready! Logged in as ${client.user.tag}`);

        // Register slash commands
        const commands = [];
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            commands.push(command.data.toJSON());
        }

        const rest = new REST({ version: '10' }).setToken(client.token);

        try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }

        // Initialize ongoing giveaways
        initializeGiveaways(client);
    },
};
