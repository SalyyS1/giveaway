const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Tạo một ticket hỗ trợ.'),
    async execute(interaction) {
        await interaction.reply({ content: 'Ticket của bạn đã được tạo. Một mod hoặc admin sẽ sớm hỗ trợ bạn.', ephemeral: true });
        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: 0,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: ['ViewChannel'] },
                { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
            ]
        });
        await channel.send(`Chào mừng ${interaction.user}, một mod hoặc admin sẽ có mặt sớm.`);
    }
};
