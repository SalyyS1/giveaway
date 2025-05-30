const fs = require('fs');
const path = require('path');
const { Client, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const giveawaysFile = path.join(__dirname, '../data/giveaways.json');

// Load existing giveaways
function loadGiveaways() {
    if (fs.existsSync(giveawaysFile)) {
        const data = fs.readFileSync(giveawaysFile, 'utf8');
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('Error parsing giveaways.json:', error);
            return []; // Return empty array if file is corrupted
        }
    } else {
        return [];
    }
}

// Save giveaways
function saveGiveaways(giveaways) {
    fs.writeFileSync(giveawaysFile, JSON.stringify(giveaways, null, 4), 'utf8');
}

const activeGiveaways = new Map(); // Map to store active giveaway timers

async function endGiveaway(giveaway, client) {
    // Prevent ending if already ended
    if (giveaway.ketthuc) return;

    const guild = client.guilds.cache.get(giveaway.guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(giveaway.channelId);
    if (!channel) return;

    const message = await channel.messages.fetch(giveaway.id).catch(() => null);
    if (!message) return;

    // Get participants from the giveaway data
    const participants = giveaway.thamgia;

    // Select winners
    const winners = [];
    const sophanThuong = Math.min(giveaway.sotrunggiai, participants.length);

    // Shuffle participants and pick winners
    const shuffledParticipants = participants.sort(() => Math.random() - 0.5);

    for (let i = 0; i < sophanThuong; i++) {
        const winnerId = shuffledParticipants[i];
        if (winnerId) {
            const winnerUser = await client.users.fetch(winnerId).catch(() => null);
            if (winnerUser) {
                winners.push(winnerUser);
            }
        }
    }

    // Create winner announcement embed
    const winnerEmbed = new EmbedBuilder()
        .setColor('#00ff00') // Green color for winner announcement
        .setTitle('🎉 CHÚC MỪNG NGƯỜI THẮNG CUỘC! 🎉')
        .setDescription(`**Phần thưởng:** 🎁 ${giveaway.phanthuong}
**Người thắng cuộc:** 👑 ${winners.map(user => user.toString()).join(', ')}
**Người tạo:** 👤 ${await client.users.fetch(giveaway.nguoitaoId).catch(() => 'Unknown')}
**Tổng số người tham gia:** 👥 ${participants.length}

> Cảm ơn tất cả mọi người đã tham gia!`)
        .setImage('https://i.pinimg.com/originals/86/62/45/86624531cd8638b2f498b6994dbf8b95.gif')
        .setFooter({ text: 'Giveaway đã kết thúc' });

    // Announce winners by editing the original giveaway message
    if (winners.length > 0) {
        const rerollButton = new ButtonBuilder()
            .setCustomId(`reroll_giveaway_${giveaway.id}`)
            .setLabel('Reroll')
            .setStyle(ButtonStyle.Primary);

        const endedButtonsRow = new ActionRowBuilder()
            .addComponents(rerollButton);

        await message.edit({ embeds: [winnerEmbed], components: [endedButtonsRow] });
    } else {
        // If no winners, edit the message to show no participants
        const noWinnerEmbed = new EmbedBuilder(message.embeds[0]) // Copy existing embed
            .setColor('#ff0000') // Red color
            .setDescription(`😥 Không có đủ người tham gia giveaway để chọn người thắng cuộc.

**Phần thưởng:** 🎁 ${giveaway.phanthuong}
**Người tạo:** 👤 ${await client.users.fetch(giveaway.nguoitaoId).catch(() => 'Unknown')}
> Cảm ơn tất cả mọi người đã tham gia!`)
            .setFooter({ text: 'Giveaway đã kết thúc' });

        // Remove all buttons if no winners
        await message.edit({ embeds: [noWinnerEmbed], components: [] });
    }

    // Distribute prizes (if file specified) - only send to winners
    if (giveaway.filephanthuong && winners.length > 0) {
        for (const winner of winners) {
            try {
                await winner.send(`Xin chúc mừng! Đây là phần thưởng của bạn từ giveaway **${giveaway.chude || giveaway.phanthuong}**: ${giveaway.filephanthuong}`);
                console.log(`Sent prize file info to ${winner.tag}`);
            } catch (error) {
                console.error(`Could not send prize file info to ${winner.tag}:`, error);
            }
        }
    }

    // Mark giveaway as ended and save
    const allGiveaways = loadGiveaways();
    const giveawayIndex = allGiveaways.findIndex(g => g.id === giveaway.id);
    if (giveawayIndex !== -1) {
        allGiveaways[giveawayIndex].ketthuc = true;
        saveGiveaways(allGiveaways);
    }

    // Remove from active timers
    activeGiveaways.delete(giveaway.id);
}

function startGiveawayTimer(giveaway, client) {
    const remainingTime = giveaway.ketthucTimestamp - Date.now();

    if (remainingTime <= 0) {
        // If giveaway should have already ended, end it now
        endGiveaway(giveaway, client);
    } else {
        // Set a timer to end the giveaway
        const timer = setTimeout(() => {
            endGiveaway(giveaway, client);
        }, remainingTime);
        activeGiveaways.set(giveaway.id, timer);
    }
}

function initializeGiveaways(client) {
    const giveaways = loadGiveaways();
    for (const giveaway of giveaways) {
        // Only start timer for ongoing giveaways
        if (!giveaway.ketthuc) {
            startGiveawayTimer(giveaway, client);
        }
    }
    console.log(`Initialized ${giveaways.length} giveaways. ${activeGiveaways.size} active timers set.`);
}

module.exports = {
    loadGiveaways,
    saveGiveaways,
    endGiveaway,
    startGiveawayTimer,
    initializeGiveaways,
    activeGiveaways
};
