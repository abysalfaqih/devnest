import { 
    SlashCommandBuilder, 
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from 'discord.js';
import MESSAGES from '../constants/messages.js';
import logger from '../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('sendlink')
        .setDescription('Buat protected download link dengan password')
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel tujuan untuk mengirim protected link')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        ),
    
    developer: false,
    admin: true,
    
    async execute(interaction) {
        try {
            const targetChannel = interaction.options.getChannel('channel');

            const modalId = `sendlink_modal_${interaction.user.id}_${Date.now()}`;
            
            if (!interaction.client.sendlinkData) {
                interaction.client.sendlinkData = new Map();
            }
            
            interaction.client.sendlinkData.set(modalId, {
                channelId: targetChannel.id,
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });

            const modal = new ModalBuilder()
                .setCustomId(modalId)
                .setTitle('Buat Protected Link');

            const titleInput = new TextInputBuilder()
                .setCustomId('embed_title')
                .setLabel('Judul Embed')
                .setPlaceholder('Masukkan Judul')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(256)
                .setRequired(true);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('embed_description')
                .setLabel('Deskripsi Embed')
                .setPlaceholder('Masukkan Deskripsi')
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(1)
                .setMaxLength(2000)
                .setRequired(true);

            const imageInput = new TextInputBuilder()
                .setCustomId('embed_image')
                .setLabel('URL Gambar (Opsional)')
                .setPlaceholder('https://example.com/image.png')
                .setStyle(TextInputStyle.Short)
                .setRequired(false);

            const buttonInput = new TextInputBuilder()
                .setCustomId('button_label')
                .setLabel('Label Tombol')
                .setPlaceholder('Download Text')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(80)
                .setRequired(true);

            const passwordInput = new TextInputBuilder()
                .setCustomId('password')
                .setLabel('Password')
                .setPlaceholder('Set Password')
                .setStyle(TextInputStyle.Short)
                .setMinLength(4)
                .setMaxLength(100)
                .setRequired(true);

            const row1 = new ActionRowBuilder().addComponents(titleInput);
            const row2 = new ActionRowBuilder().addComponents(descriptionInput);
            const row3 = new ActionRowBuilder().addComponents(imageInput);
            const row4 = new ActionRowBuilder().addComponents(buttonInput);
            const row5 = new ActionRowBuilder().addComponents(passwordInput);

            modal.addComponents(row1, row2, row3, row4, row5);

            await interaction.showModal(modal);

            setTimeout(() => {
                if (interaction.client.sendlinkData) {
                    interaction.client.sendlinkData.delete(modalId);
                }
            }, 300000);

        } catch (error) {
            logger.error('Sendlink command error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Gagal membuat protected link!',
                    ephemeral: true
                });
            }
        }
    }
};