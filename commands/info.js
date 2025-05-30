const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Hiển thị thông tin về bot.'),
    async execute(interaction) {
        const infoEmbed = new EmbedBuilder()
            .setColor(0x0099FF) // Màu xanh dương
            .setTitle('📊 Thông tin Bot')
            .setDescription('Đây là bot Discord đa năng với nhiều tính năng hữu ích.\n\n**Source code by:** SalyVn')
            .setThumbnail(interaction.client.user.displayAvatarURL()) // Ảnh đại diện của bot
            .addFields(
                { name: 'Tên Bot', value: interaction.client.user.tag, inline: true },
                { name: 'ID Bot', value: interaction.client.user.id, inline: true },
                { name: 'Số Server', value: `${interaction.client.guilds.cache.size}`, inline: true },
                { name: 'Số Người dùng', value: `${interaction.client.users.cache.size}`, inline: true }, // Có thể không chính xác nếu bot không fetch hết user
                { name: 'Ping', value: `${interaction.client.ws.ping}ms`, inline: true },
                { name: 'Phiên bản Discord.js', value: require('discord.js').version, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Thông tin được cập nhật gần đây' });

        await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
    },
};
