const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannir un utilisateur.')
        .addUserOption(option => option.setName('utilisateur').setDescription('Utilisateur à bannir').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
        }
        const user = interaction.options.getUser('utilisateur');
        try {
            await interaction.guild.members.ban(user);
            await interaction.reply(`Đã cấm ${user.tag}.`);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Có lỗi xảy ra khi cấm người dùng này.', ephemeral: true });
        }
    }
};
