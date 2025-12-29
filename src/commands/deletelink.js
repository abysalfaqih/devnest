import { 
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import linkManager from '../utils/linkManager.js';
import { showProgress, completeProgress } from '../utils/progressIndicator.js';
import logger from '../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('deletelink')
        .setDescription('Hapus protected link')
        .addStringOption(option =>
            option
                .setName('message_id')
                .setDescription('Message ID dari protected link (lihat /listlinks)')
                .setRequired(true)
        ),
    
    developer: false,
    admin: true,
    
    async execute(interaction) {
        try {
            await showProgress(interaction, true, '🔍 Mencari protected link...');

            const messageId = interaction.options.getString('message_id');
            
            const link = linkManager.getLink(messageId);
            
            if (!link) {
                return await completeProgress(
                    interaction,
                    '❌ Protected link tidak ditemukan! Gunakan `/listlinks` untuk melihat ID yang valid.',
                    false
                );
            }

            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('⚠️ Konfirmasi Hapus Protected Link')
                .setDescription(
                    `Apakah Anda yakin ingin menghapus protected link ini?\n\n` +
                    `**Title:** ${link.embedTitle}\n` +
                    `**Channel:** <#${link.channelId}>\n` +
                    `**Akses:** ${link.accessCount}x\n` +
                    `**Created:** <t:${Math.floor(link.createdAt / 1000)}:R>\n\n` +
                    `⚠️ **Peringatan:** Aksi ini tidak bisa dibatalkan!\n` +
                    `Message embed di channel juga akan dihapus.`
                )
                .setTimestamp();

            const confirmButton = new ButtonBuilder()
                .setCustomId(`confirm_delete_${messageId}`)
                .setLabel('✅ Ya, Hapus')
                .setStyle(ButtonStyle.Danger);

            const cancelButton = new ButtonBuilder()
                .setCustomId(`cancel_delete_${messageId}`)
                .setLabel('❌ Batal')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder()
                .addComponents(cancelButton, confirmButton);

            await interaction.editReply({
                content: null,
                embeds: [embed],
                components: [row]
            });

        } catch (error) {
            logger.error('Deletelink command error:', error);
            await completeProgress(
                interaction,
                '❌ Gagal memproses permintaan hapus!',
                false
            );
        }
    }
};