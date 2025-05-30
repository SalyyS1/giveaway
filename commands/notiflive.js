const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('notiflive')
        .setDescription('Mô phỏng thông báo live stream (chỉ để test).'),
    async execute(interaction) {
        await interaction.reply(`🔴 **LIVE ĐANG DIỄN RA!**\nStreamer: \`Exemple\`\nLiên kết: https://twitch.tv/exemple`);
    }
};
