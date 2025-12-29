import { 
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from 'discord.js';
import linkManager from '../utils/linkManager.js';
import logger from '../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('editlink')
        .setDescription('Edit protected link yang sudah ada')
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
            const messageId = interaction.options.getString('message_id');
            
            const link = linkManager.getLink(messageId);
            
            if (!link) {
                return await interaction.reply({
                    content: '❌ Protected link tidak ditemukan! Gunakan `/listlinks` untuk melihat ID yang valid.',
                    ephemeral: true
                });
            }

            const modalId = `editlink_modal_${interaction.user.id}_${Date.now()}`;
            
            if (!interaction.client.editlinkData) {
                interaction.client.editlinkData = new Map();
            }
            
            interaction.client.editlinkData.set(modalId, {
                messageId: messageId,
                originalData: link,
                userId: interaction.user.id
            });

            const modal = new ModalBuilder()
                .setCustomId(modalId)
                .setTitle(`Edit: ${link.embedTitle.substring(0, 30)}`);

            const titleInput = new TextInputBuilder()
                .setCustomId('embed_title')
                .setLabel('Judul Embed')
                .setPlaceholder('Judul baru atau biarkan sama')
                .setStyle(TextInputStyle.Short)
                .setValue(link.embedTitle)
                .setMinLength(1)
                .setMaxLength(256)
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('embed_description')
                .setLabel('Deskripsi Embed')
                .setPlaceholder('Deskripsi baru atau biarkan sama')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(link.embedDescription)
                .setMinLength(1)
                .setMaxLength(2000)
                .setRequired(true);

            const imageInput = new TextInputBuilder()
                .setCustomId('embed_image')
                .setLabel('URL Gambar (Opsional)')
                .setPlaceholder('Kosongkan jika tidak ingin gambar')
                .setStyle(TextInputStyle.Short)
                .setValue(link.embedImage || '')
                .setRequired(false);

            const buttonInput = new TextInputBuilder()
                .setCustomId('button_label')
                .setLabel('Label Tombol')
                .setPlaceholder('Label tombol baru')
                .setStyle(TextInputStyle.Short)
                .setValue(link.buttonLabel)
                .setMinLength(1)
                .setMaxLength(80)
                .setRequired(true);

            const passwordInput = new TextInputBuilder()
                .setCustomId('password')
                .setLabel('Password Baru (Opsional)')
                .setPlaceholder('Kosongkan jika tidak ingin ganti password')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const row1 = new ActionRowBuilder().addComponents(titleInput);
            const row2 = new ActionRowBuilder().addComponents(descriptionInput);
            const row3 = new ActionRowBuilder().addComponents(imageInput);
            const row4 = new ActionRowBuilder().addComponents(buttonInput);
            const row5 = new ActionRowBuilder().addComponents(passwordInput);

            modal.addComponents(row1, row2, row3, row4, row5);

            await interaction.showModal(modal);

            setTimeout(() => {
                if (interaction.client.editlinkData) {
                    interaction.client.editlinkData.delete(modalId);
                }
            }, 300000);

        } catch (error) {
            logger.error('Editlink command error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Gagal membuka form edit!',
                    ephemeral: true
                });
            }
        }
    }
};