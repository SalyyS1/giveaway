const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { parseDuration } = require('../utils/timeParser');
const { loadGiveaways, saveGiveaways, startGiveawayTimer, endGiveaway, activeGiveaways } = require('../utils/giveawayManager');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            // Handle Slash Commands
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({
                        content: 'Có lỗi xảy ra khi thực thi lệnh!',
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: 'Có lỗi xảy ra khi thực thi lệnh!',
                        ephemeral: true
                    });
                }
            }
        } else if (interaction.isButton()) {
            // Handle Button Interactions
            if (interaction.customId === 'create_giveaway_modal') {
                // Create the modal
                const modal = new ModalBuilder()
                    .setCustomId('giveaway_modal') // Simplified custom ID
                    .setTitle('Tạo Giveaway Mới');

                // Add components to modal (Text Inputs) - Max 5 rows
                const phanthuongInput = new TextInputBuilder()
                    .setCustomId('phanthuongInput')
                    .setLabel('Phần thưởng')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const sotrunggiaiInput = new TextInputBuilder()
                    .setCustomId('sotrunggiaiInput')
                    .setLabel('Số lượng người trúng giải')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const thoigianketthucInput = new TextInputBuilder()
                    .setCustomId('thoigianketthucInput')
                    .setLabel('Thời gian kết thúc (ví dụ: 1h, 3d)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const yeucauinvitesInput = new TextInputBuilder()
                    .setCustomId('yeucauinvitesInput')
                    .setLabel('Yêu cầu lời mời (số)')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const filephanthuongInput = new TextInputBuilder()
                    .setCustomId('filephanthuongInput')
                    .setLabel('Link/Mô tả file phần thưởng (tùy chọn)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false);

                // Add inputs to action rows
                const firstActionRow = new ActionRowBuilder().addComponents(phanthuongInput);
                const secondActionRow = new ActionRowBuilder().addComponents(sotrunggiaiInput);
                const thirdActionRow = new ActionRowBuilder().addComponents(thoigianketthucInput);
                const fourthActionRow = new ActionRowBuilder().addComponents(yeucauinvitesInput);
                const fifthActionRow = new ActionRowBuilder().addComponents(filephanthuongInput);

                // Add action rows to modal
                modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

                // Show the modal to the user
                await interaction.showModal(modal);
            } else if (interaction.customId === 'check_my_invites') {
                await interaction.deferReply({ ephemeral: true });
                const guild = interaction.guild;
                if (!guild) {
                    return interaction.editReply({ content: 'Lệnh này chỉ có thể sử dụng trong server.' });
                }

                try {
                    const invites = await guild.invites.fetch();
                    const userInvites = invites.filter(i => i.inviter && i.inviter.id === interaction.user.id);
                    let totalUses = 0;
                    userInvites.forEach(invite => totalUses += invite.uses);

                    await interaction.editReply({ content: `Bạn hiện có ${totalUses} lời mời trong server này.` });
                } catch (error) {
                    console.error('Error fetching invites for check:', error);
                    await interaction.editReply({ content: 'Có lỗi xảy ra khi kiểm tra số lượng lời mời của bạn.' });
                }

            } else if (interaction.customId.startsWith('end_giveaway_')) {
                 // Handle end giveaway button
                 const giveawayId = interaction.customId.split('_')[2]; // Extract giveaway ID correctly
                 const giveaways = loadGiveaways();
                 const giveawayIndex = giveaways.findIndex(g => g.id === giveawayId && !g.ketthuc);
                 const giveaway = giveaways[giveawayIndex];

                 if (!giveaway) {
                     return interaction.reply({ content: 'Giveaway này không tồn tại hoặc đã kết thúc.', ephemeral: true });
                 }

                 // Check for manage guild permission
                 if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                      return interaction.reply({ content: 'Bạn không có quyền kết thúc giveaway này.', ephemeral: true });
                 }

                 await interaction.deferReply({ ephemeral: true });

                 // Disable the end button and update message components
                if (interaction.message) {
                     const updatedComponents = interaction.message.components.map(row => {
                         if (row.components.some(comp => comp.customId && comp.customId.startsWith('end_giveaway_'))) {
                             return new ActionRowBuilder().addComponents(
                                 row.components.map(comp => {
                                     if (comp.customId && comp.customId.startsWith('end_giveaway_')) {
                                         return new ButtonBuilder(comp.data).setDisabled(true);
                                     } else {
                                         return new ButtonBuilder(comp.data);
                                     }
                                 })
                             );
                         } else {
                             return row;
                         }
                     });
                     await interaction.message.edit({ components: updatedComponents });
                 }

                 // Clear the giveaway timer if it exists
                 if (activeGiveaways.has(giveaway.id)) {
                     clearTimeout(activeGiveaways.get(giveaway.id));
                     activeGiveaways.delete(giveaway.id);
                 }

                 await endGiveaway(giveaway, interaction.client);
                 await interaction.editReply({ content: 'Giveaway đã được kết thúc sớm.' });

            } else if (interaction.customId.startsWith('reroll_giveaway_')) {
                // Handle reroll giveaway button
                const giveawayId = interaction.customId.replace('reroll_giveaway_', '');
                const giveaways = loadGiveaways();
                const giveaway = giveaways.find(g => g.id === giveawayId && g.ketthuc);

                if (!giveaway) {
                     return interaction.reply({ content: 'Giveaway này không tồn tại hoặc chưa kết thúc.', ephemeral: true });
                }

                // Check for manage guild permission
                 if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                      return interaction.reply({ content: 'Bạn không có quyền reroll giveaway này.', ephemeral: true });
                 }

                await interaction.deferReply();

                // Get all reactions for the 🎉 emoji
                const message = await interaction.channel.messages.fetch(giveawayId).catch(() => null);
                if (!message) {
                    return interaction.editReply({ content: 'Không thể tìm thấy tin nhắn giveaway.' });
                }

                const reaction = message.reactions.cache.get('🎉');
                if (!reaction) {
                    return interaction.editReply({ content: 'Không tìm thấy reaction cho giveaway này.' });
                }

                // Fetch all users who reacted
                const users = await reaction.users.fetch();
                const participants = users.filter(user => !user.bot).map(user => user.id);

                // Select new winners
                const winners = [];
                const sophanThuong = Math.min(giveaway.sotrunggiai, participants.length);

                // Shuffle participants and pick new winners
                const shuffledParticipants = participants.sort(() => Math.random() - 0.5);

                for (let i = 0; i < sophanThuong; i++) {
                    const winnerId = shuffledParticipants[i];
                    if (winnerId) {
                        const winnerUser = await interaction.client.users.fetch(winnerId).catch(() => null);
                        if (winnerUser) {
                            winners.push(winnerUser);
                        }
                    }
                }

                // Create winner announcement embed for reroll
                const rerollEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🎉 CHÚC MỪNG NGƯỜI THẮNG CUỘC MỚI! 🎉')
                    .setDescription(`**Phần thưởng:** 🎁 ${giveaway.phanthuong}
**Người thắng cuộc mới:** 👑 ${winners.map(user => user.toString()).join(', ')}
**Người tạo:** 👤 ${await interaction.client.users.fetch(giveaway.nguoitaoId).catch(() => 'Unknown')}

> Cảm ơn tất cả mọi người đã tham gia!`)
                    .setImage('https://i.pinimg.com/originals/86/62/45/86624531cd8638b2f498b6994dbf8b95.gif')
                    .setFooter({ text: 'Giveaway đã kết thúc' });

                const rerollMessage = winners.length > 0
                    ? await interaction.channel.send({ embeds: [rerollEmbed] })
                    : await interaction.channel.send('😥 Không có đủ người tham gia để reroll giveaway.');

                // Send prize file info to new winners
                if (giveaway.filephanthuong && winners.length > 0) {
                    for (const winner of winners) {
                        try {
                            await winner.send(`Xin chúc mừng! Đây là phần thưởng của bạn từ giveaway **${giveaway.chude || giveaway.phanthuong}**: ${giveaway.filephanthuong}`);
                            console.log(`Sent rerolled prize file info to ${winner.tag}`);
                        } catch (error) {
                            console.error(`Could not send rerolled prize file info to ${winner.tag}:`, error);
                        }
                    }
                }

                await interaction.editReply({ content: 'Đã reroll giveaway thành công!' });
            } else if (interaction.customId.startsWith('join_giveaway_')) {
                const giveawayId = interaction.customId.replace('join_giveaway_', '');
                const giveaways = loadGiveaways();
                const giveaway = giveaways.find(g => g.id === giveawayId && !g.ketthuc);

                if (!giveaway) {
                    return interaction.reply({
                        content: 'Giveaway này không tồn tại hoặc đã kết thúc.',
                        ephemeral: true
                    });
                }

                // Check if user has already joined
                if (giveaway.thamgia.includes(interaction.user.id)) {
                    return interaction.reply({
                        content: 'Bạn đã tham gia giveaway này rồi!',
                        ephemeral: true
                    });
                }

                // Check invite requirement
                if (giveaway.yeucauinvites > 0) {
                    const guild = interaction.guild;
                    const invites = await guild.invites.fetch();
                    const userInvites = invites.filter(i => i.inviter && i.inviter.id === interaction.user.id);
                    let totalUses = 0;
                    userInvites.forEach(invite => totalUses += invite.uses);

                    if (totalUses < giveaway.yeucauinvites) {
                        return interaction.reply({
                            content: `Bạn cần mời ít nhất ${giveaway.yeucauinvites} người để tham gia giveaway này. Hiện tại bạn đã mời ${totalUses} người.`,
                            ephemeral: true
                        });
                    }
                }

                // Add user to participants
                giveaway.thamgia.push(interaction.user.id);
                saveGiveaways(giveaways);

                // Update embed with new participant count
                const message = await interaction.message.fetch(true);
                const embed = EmbedBuilder.from(message.embeds[0]);

                const oldDescription = embed.data.description;
                const newDescription = oldDescription.replace(
                    /\*\*👥 Số người đã tham gia:\*\* \d+/,
                    `**👥 Số người đã tham gia:** ${giveaway.thamgia.length}`
                );
                embed.setDescription(newDescription);

                await message.edit({ embeds: [embed] });

                await interaction.reply({
                    content: 'Bạn đã tham gia giveaway thành công!',
                    ephemeral: true
                });
            }

        } else if (interaction.isModalSubmit()) {
            // Handle Modal Submissions
            if (interaction.customId === 'giveaway_modal') { // Simplified custom ID
                await interaction.deferReply({ ephemeral: true });

                const phanthuong = interaction.fields.getTextInputValue('phanthuongInput');
                const sotrunggiaiString = interaction.fields.getTextInputValue('sotrunggiaiInput');
                const thoigianketthucString = interaction.fields.getTextInputValue('thoigianketthucInput');
                const yeucauinvitesString = interaction.fields.getTextInputValue('yeucauinvitesInput');
                const filephanthuong = interaction.fields.getTextInputValue('filephanthuongInput');

                // Validate inputs
                const sotrunggiai = parseInt(sotrunggiaiString);
                if (isNaN(sotrunggiai) || sotrunggiai <= 0) {
                    return interaction.editReply({ content: 'Số người trúng giải không hợp lệ. Vui lòng nhập một số nguyên dương.' });
                }

                const duration = parseDuration(thoigianketthucString);
                if (duration === 0) {
                    return interaction.editReply({ content: 'Thời gian kết thúc không hợp lệ. Vui lòng sử dụng định dạng như 1h, 3d, 5m.' });
                }

                const yeucauinvites = parseInt(yeucauinvitesString) || 0;
                if (isNaN(yeucauinvites) || yeucauinvites < 0) {
                    return interaction.editReply({ content: 'Yêu cầu lời mời không hợp lệ. Vui lòng nhập một số nguyên không âm.' });
                }

                // Create the giveaway embed message
                const ketthucTimestamp = Date.now() + duration;
                const chude = phanthuong;

                const giveawayEmbed = new EmbedBuilder()
                    .setColor(16753920)
                    .setTitle('🎉 GIVEAWAY ĐANG DIỄN RA 🎉')
                    .setDescription(`**🎁 Phần thưởng:** ${phanthuong}

**🏆 Số người trúng giải:** ${sotrunggiai}

**👥 Số người đã tham gia:** 0

**⏰ Thời gian kết thúc:** <t:${Math.floor(ketthucTimestamp / 1000)}:R>

**👤 Người tạo:** ${interaction.user}

**📨 Yêu cầu:** Mời ít nhất ${yeucauinvites} người

> 💬 Chúc may mắn đến tất cả mọi người!`)
                    .setImage('https://i.pinimg.com/originals/86/62/45/86624531cd8638b2f498b6994dbf8b95.gif')
                    .setFooter({
                        text: 'Giveaway được tài trợ bởi máy chủ của chúng ta ❤️'
                    });

                // Add buttons to the giveaway message
                // Create buttons WITHOUT message ID first
                const checkInvitesButton = new ButtonBuilder()
                    .setCustomId('check_my_invites')
                    .setLabel('Kiểm tra Lời mời')
                    .setStyle(ButtonStyle.Secondary);

                const endGiveawayButton = new ButtonBuilder()
                    .setCustomId('end_giveaway_') // Temporary ID
                    .setLabel('Kết thúc Giveaway')
                    .setStyle(ButtonStyle.Danger);

                const joinGiveawayButton = new ButtonBuilder()
                     .setCustomId('join_giveaway_') // Temporary ID
                     .setLabel('Tham Gia Giveaway')
                     .setStyle(ButtonStyle.Success);

                const giveawayButtonsRow1 = new ActionRowBuilder()
                    .addComponents(checkInvitesButton, endGiveawayButton);

                const giveawayButtonsRow2 = new ActionRowBuilder()
                     .addComponents(joinGiveawayButton);

                // Send the giveaway message with temporary buttons
                const giveawayChannel = interaction.channel;
                if (!giveawayChannel) {
                    return interaction.editReply({ content: 'Không thể tìm thấy kênh để gửi tin nhắn giveaway.' });
                }

                const giveawayMessage = await giveawayChannel.send({
                    content: null, // Role ping removed
                    embeds: [giveawayEmbed],
                    components: [giveawayButtonsRow1, giveawayButtonsRow2]
                });

                // Now create buttons with the correct message ID and edit the message
                const finalCheckInvitesButton = new ButtonBuilder()
                    .setCustomId('check_my_invites')
                    .setLabel('Kiểm tra Lời mời')
                    .setStyle(ButtonStyle.Secondary);

                const finalEndGiveawayButton = new ButtonBuilder()
                    .setCustomId(`end_giveaway_${giveawayMessage.id}`)
                    .setLabel('Kết thúc Giveaway')
                    .setStyle(ButtonStyle.Danger);

                const finalJoinGiveawayButton = new ButtonBuilder()
                    .setCustomId(`join_giveaway_${giveawayMessage.id}`)
                    .setLabel('Tham Gia Giveaway')
                    .setStyle(ButtonStyle.Success);

                const finalButtonsRow1 = new ActionRowBuilder()
                    .addComponents(finalCheckInvitesButton, finalEndGiveawayButton);

                const finalButtonsRow2 = new ActionRowBuilder()
                    .addComponents(finalJoinGiveawayButton);

                await giveawayMessage.edit({
                    components: [finalButtonsRow1, finalButtonsRow2]
                });

                // Store giveaway data
                const giveaways = loadGiveaways();
                giveaways.push({
                    id: giveawayMessage.id,
                    channelId: giveawayMessage.channelId,
                    guildId: giveawayMessage.guildId,
                    chude: phanthuong,
                    phanthuong: phanthuong,
                    sotrunggiai: sotrunggiai,
                    ketthucTimestamp: ketthucTimestamp,
                    nguoitaoId: interaction.user.id,
                    pingroleId: null, // Role ID is no longer stored
                    yeucauinvites: yeucauinvites,
                    filephanthuong: filephanthuong || null,
                    thamgia: [],
                    ketthuc: false
                });
                saveGiveaways(giveaways);

                // Start the giveaway timer
                startGiveawayTimer(giveaways[giveaways.length - 1], interaction.client);

                await interaction.editReply({ content: 'Giveaway đã được tạo thành công!' });
            }
        }
    },
};
