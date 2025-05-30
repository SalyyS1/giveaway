const { Events } = require('discord.js');
const { loadGiveaways, saveGiveaways } = require('../utils/giveawayManager');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Ignore reactions from bots
        if (user.bot) return;

        // If the reaction is not cached, fetch it
        if (!reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        // Check if the reaction is on a giveaway message and is the 🎉 emoji
        const giveaways = loadGiveaways();
        const giveaway = giveaways.find(g => g.id === reaction.message.id && !g.ketthuc);

        if (!giveaway || reaction.emoji.name !== '🎉') {
            return; // Not a valid reaction on an active giveaway
        }

        // Check if user already participated
        if (giveaway.thamgia.includes(user.id)) {
            // Optional: inform user they already participated
            // console.log(`${user.tag} already participated.`);
            return;
        }

        // Fetch the member object to check roles and invites (requires GUILD_MEMBERS and GUILD_INVITES intents)
        const guild = reaction.message.guild;
        if (!guild) return; // Should not happen for guild messages

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) return; // User not found in guild

        // Check role requirement
        if (giveaway.pingroleId) {
            if (!member.roles.cache.has(giveaway.pingroleId)) {
                // User does not have the required role
                await user.send(`Bạn cần có role <@&${giveaway.pingroleId}> để tham gia giveaway **${giveaway.chude}**.`);
                await reaction.users.remove(user.id); // Remove their reaction
                return;
            }
        }

        // Check invites requirement (Requires GUILD_INVITES intent and might need caching/fetching logic)
        if (giveaway.yeucauinvites > 0) {
            // **Note:** Fetching invite counts for a specific user accurately can be complex.
            // A simple approach is to fetch all guild invites and count those created by the user.
            // This might be resource-intensive for large guilds with many invites.
            // We will implement a basic check here.

            try {
                 const invites = await guild.invites.fetch();
                 const userInvites = invites.filter(i => i.inviter && i.inviter.id === user.id);
                 let totalUses = 0;
                 userInvites.forEach(invite => totalUses += invite.uses);

                 if (totalUses < giveaway.yeucauinvites) {
                     await user.send(`Bạn cần mời ${giveaway.yeucauinvites} người để tham gia giveaway **${giveaway.chude}**. Bạn hiện có ${totalUses} lời mời.`);
                     await reaction.users.remove(user.id); // Remove their reaction
                     return;
                 }
            } catch (error) {
                console.error('Error fetching invites:', error);
                // Optionally inform user about the error or skip invite check if fetching fails
                await user.send(`Có lỗi xảy ra khi kiểm tra số lượng lời mời của bạn cho giveaway **${giveaway.chude}**. Vui lòng thử lại sau.`);
                await reaction.users.remove(user.id); // Remove their reaction
                return;
            }
        }

        // User meets requirements, add to participants list
        giveaway.thamgia.push(user.id);
        saveGiveaways(giveaways);

        // Optional: Update the giveaway message to show participant count
        // This requires fetching the message and editing its embed. Can be added later if needed.
        console.log(`${user.tag} participated in giveaway ${giveaway.id}`);
    },
};
