const { REST, Routes } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const TOKEN = 'MTM3MTM2Njg4ODkzNTc4NDQ1OA.GFISRg.HJ8ZHsbVO17SoFApyssNHzUYNNi8NzEOYVKuyU';
const CLIENT_ID = '1371366888935784458';

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Xóa và đăng ký lại commands
(async () => {
    try {
        console.log('Started removing all application (/) commands.');

        // Lấy danh sách tất cả commands
        const commands = await rest.get(
            Routes.applicationCommands(CLIENT_ID)
        );

        // Xóa từng command
        for (const command of commands) {
            await rest.delete(
                Routes.applicationCommand(CLIENT_ID, command.id)
            );
            console.log(`Deleted command: ${command.name}`);
        }

        console.log('Successfully removed all application (/) commands.');

        // Đăng ký commands mới
        const newCommands = [];
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            newCommands.push(command.data.toJSON());
        }

        console.log('Started registering new application (/) commands.');

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: newCommands },
        );

        console.log('Successfully registered new application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
