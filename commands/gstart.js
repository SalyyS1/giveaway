const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupgiveaway')
        .setDescription('Tạo một giveaway mới')
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Role sẽ được ping khi giveaway được tạo')
                .setRequired(false)),
    async execute(interaction) {
        // Create the button
        const createGiveawayButton = new ButtonBuilder()
            .setCustomId('create_giveaway_modal')
            .setLabel('Tạo Giveaway')
            .setStyle(ButtonStyle.Primary);

        // Create an action row and add the button to it
        const row = new ActionRowBuilder()
            .addComponents(createGiveawayButton);

        // Send the message with the button
        await interaction.reply({
            content: 'Nhấn nút bên dưới để tạo một giveaway mới!',
            components: [row]
        });
    },
};
