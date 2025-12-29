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
        .setName('sendmsg')
        .setDescription('Kirim pesan ke channel tertentu')
        .addBooleanOption(option =>
            option
                .setName('embed')
                .setDescription('Gunakan embed untuk pesan?')
                .setRequired(true)
        )
        .addChannelOption(option =>
            option
                .setName('channel')
                .setDescription('Channel tujuan untuk mengirim pesan')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(true)
        ),
    
    developer: false,
    admin: true,
    
    async execute(interaction) {
        try {
            const useEmbed = interaction.options.getBoolean('embed');
            const targetChannel = interaction.options.getChannel('channel');

            // Simpan data ke interaction untuk digunakan di modal handler
            // Kita akan menggunakan customId yang unik
            const modalId = `sendmsg_modal_${interaction.user.id}_${Date.now()}`;
            
            // Store data temporarily (akan diambil di interactionCreate handler)
            if (!interaction.client.sendmsgData) {
                interaction.client.sendmsgData = new Map();
            }
            
            interaction.client.sendmsgData.set(modalId, {
                useEmbed: useEmbed,
                channelId: targetChannel.id,
                userId: interaction.user.id
            });

            // Buat modal
            const modal = new ModalBuilder()
                .setCustomId(modalId)
                .setTitle(MESSAGES.SENDMSG.MODAL_TITLE);

            // Input untuk pesan (wajib)
            const messageInput = new TextInputBuilder()
                .setCustomId('message_content')
                .setLabel(MESSAGES.SENDMSG.MODAL_MESSAGE_LABEL)
                .setPlaceholder(MESSAGES.SENDMSG.MODAL_MESSAGE_PLACEHOLDER)
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(1)
                .setMaxLength(4000)
                .setRequired(true);

            const messageRow = new ActionRowBuilder().addComponents(messageInput);

            // Jika menggunakan embed, tambahkan input untuk title, color, dan image
            if (useEmbed) {
                const titleInput = new TextInputBuilder()
                    .setCustomId('embed_title')
                    .setLabel(MESSAGES.SENDMSG.MODAL_TITLE_LABEL)
                    .setPlaceholder(MESSAGES.SENDMSG.MODAL_TITLE_PLACEHOLDER)
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(1)
                    .setMaxLength(256)
                    .setRequired(false);

                const colorInput = new TextInputBuilder()
                    .setCustomId('embed_color')
                    .setLabel(MESSAGES.SENDMSG.MODAL_COLOR_LABEL)
                    .setPlaceholder(MESSAGES.SENDMSG.MODAL_COLOR_PLACEHOLDER)
                    .setStyle(TextInputStyle.Short)
                    .setMinLength(6)
                    .setMaxLength(7)
                    .setRequired(false);

                const imageInput = new TextInputBuilder()
                    .setCustomId('embed_image')
                    .setLabel(MESSAGES.SENDMSG.MODAL_IMAGE_LABEL)
                    .setPlaceholder(MESSAGES.SENDMSG.MODAL_IMAGE_PLACEHOLDER)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false);

                const titleRow = new ActionRowBuilder().addComponents(titleInput);
                const colorRow = new ActionRowBuilder().addComponents(colorInput);
                const imageRow = new ActionRowBuilder().addComponents(imageInput);

                modal.addComponents(titleRow, messageRow, colorRow, imageRow);
            } else {
                modal.addComponents(messageRow);
            }

            await interaction.showModal(modal);

            // Cleanup data setelah 5 menit jika tidak digunakan
            setTimeout(() => {
                if (interaction.client.sendmsgData) {
                    interaction.client.sendmsgData.delete(modalId);
                }
            }, 300000);

        } catch (error) {
            logger.error('Sendmsg command error:', error);
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: MESSAGES.SENDMSG.ERROR_SEND,
                    ephemeral: true
                });
            }
        }
    }
};