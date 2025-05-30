const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads the entire bot.'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Clear require cache
            Object.keys(require.cache).forEach(key => {
                if (key.includes('commands') || key.includes('events') || key.includes('utils')) {
                    delete require.cache[key];
                }
            });

            // Reload commands
            const commandsPath = path.join(__dirname);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                if (fs.existsSync(filePath)) {
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    if (command.data && typeof command.execute === 'function') {
                        interaction.client.commands.set(command.data.name, command);
                    } else {
                        console.warn(`[WARNING] The file ${file} does not export a valid command.`);
                    }
                } else {
                    console.warn(`[WARNING] Command file ${file} not found during reload.`);
                }
            }

            // Reload events
            const eventsPath = path.join(__dirname, '..', 'events');
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

            for (const file of eventFiles) {
                const filePath = path.join(eventsPath, file);
                if (fs.existsSync(filePath)) {
                    delete require.cache[require.resolve(filePath)];
                    require(filePath);
                } else {
                    console.warn(`[WARNING] Event file ${file} not found during reload.`);
                }
            }

            // Reload utils
            const utilsPath = path.join(__dirname, '..', 'utils');
            const utilFiles = fs.readdirSync(utilsPath).filter(file => file.endsWith('.js'));

            for (const file of utilFiles) {
                const filePath = path.join(utilsPath, file);
                if (fs.existsSync(filePath)) {
                    delete require.cache[require.resolve(filePath)];
                    require(filePath);
                } else {
                    console.warn(`[WARNING] Util file ${file} not found during reload.`);
                }
            }

            await interaction.editReply({
                content: 'Bot đã được reload thành công!',
                ephemeral: true
            });
        } catch (error) {
            console.error('Error during bot reload:', error);
            await interaction.editReply({
                content: `Có lỗi xảy ra khi reload bot:\n\`${error.message}\``,
                ephemeral: true
            });
        }
    },
};
