import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import linkManager from '../utils/linkManager.js';
import { showProgress, completeProgress } from '../utils/progressIndicator.js';
import logger from '../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('listlinks')
        .setDescription('List semua protected links yang ada')
        .addBooleanOption(option =>
            option
                .setName('mylinks')
                .setDescription('Hanya tampilkan link yang saya buat')
                .setRequired(false)
        ),
    
    developer: false,
    admin: true,
    
    async execute(interaction) {
        try {
            await showProgress(interaction, true, '🔍 Mencari protected links...');

            const myLinksOnly = interaction.options.getBoolean('mylinks') || false;
            
            let links;
            if (myLinksOnly) {
                links = linkManager.getLinksByUser(interaction.user.id);
            } else {
                links = linkManager.getLinksByGuild(interaction.guild.id);
            }

            if (links.length === 0) {
                return await completeProgress(
                    interaction,
                    myLinksOnly 
                        ? '📭 Anda belum membuat protected link apapun.'
                        : '📭 Tidak ada protected link di server ini.',
                    true
                );
            }

            const chunks = [];
            for (let i = 0; i < links.length; i += 10) {
                chunks.push(links.slice(i, i + 10));
            }

            const embed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle(myLinksOnly ? '🔐 Protected Links Saya' : '🔐 Protected Links Server')
                .setDescription(`Total: ${links.length} link(s)`)
                .setTimestamp()
                .setFooter({ text: `Page 1/${chunks.length}` });

            for (const link of chunks[0]) {
                const channel = interaction.guild.channels.cache.get(link.channelId);
                const channelMention = channel ? `<#${channel.id}>` : 'Channel Deleted';
                const creator = await interaction.client.users.fetch(link.createdBy).catch(() => null);
                const creatorName = creator ? creator.tag : 'Unknown User';
                
                const date = new Date(link.createdAt);
                const dateStr = date.toLocaleString('id-ID', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                embed.addFields({
                    name: `📌 ${link.embedTitle}`,
                    value: 
                        `**ID:** \`${link.id}\`\n` +
                        `**Channel:** ${channelMention}\n` +
                        `**Button:** ${link.buttonLabel}\n` +
                        `**Created:** ${dateStr}\n` +
                        `**Creator:** ${creatorName}\n` +
                        `**Access:** ${link.accessCount}x\n` +
                        `[Jump to Message](https://discord.com/channels/${link.guildId}/${link.channelId}/${link.messageId})`,
                    inline: false
                });
            }

            const stats = linkManager.getStats();
            embed.addFields({
                name: '📊 Statistics',
                value: `Total Links: ${stats.totalLinks} | Total Access: ${stats.totalAccess}`,
                inline: false
            });

            await interaction.editReply({
                content: null,
                embeds: [embed]
            });

            logger.info(`${interaction.user.tag} listed protected links`);

        } catch (error) {
            logger.error('Listlinks command error:', error);
            await completeProgress(
                interaction,
                '❌ Gagal mengambil data protected links!',
                false
            );
        }
    }
};