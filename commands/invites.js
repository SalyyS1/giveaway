const { SlashCommandBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Hiển thị số lượng lời mời của bạn.'),
    async execute(interaction) {
        const invites = await interaction.guild.invites.fetch();
        const userInvites = invites.filter(i => i.inviter && i.inviter.id === interaction.user.id);
        let inviteCount = 0;
        userInvites.forEach(i => inviteCount += i.uses);
        await interaction.reply(`${interaction.user.tag} có ${inviteCount} lời mời.`);
    }
};
