import {
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from 'discord.js';
import logger from '../../utils/logger.js';
import MESSAGES from '../../constants/messages.js';
import linkManager from '../../utils/linkManager.js';

/**
 * Handler untuk button access link (meminta password)
 */
export async function handleAccessLinkButton(interaction) {
    try {
        const messageId = interaction.customId.replace('access_link_', '');
        
        const link = linkManager.getLink(messageId);
        if (!link) {
            return await interaction.reply({
                content: MESSAGES.ERROR.LINK_NOT_FOUND,
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`password_check_${messageId}`)
            .setTitle(MESSAGES.PROTECTED_LINK.MODAL_PASSWORD_TITLE);

        const passwordInput = new TextInputBuilder()
            .setCustomId('password_input')
            .setLabel(MESSAGES.PROTECTED_LINK.MODAL_PASSWORD_LABEL)
            .setPlaceholder(MESSAGES.PROTECTED_LINK.MODAL_PASSWORD_PLACEHOLDER)
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(100)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(passwordInput);
        modal.addComponents(row);

        await interaction.showModal(modal);

    } catch (error) {
        logger.error('Access link button error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Terjadi error!',
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }
    }
}

/**
 * Handler untuk button show secret modal (create link step 2)
 */
export async function handleShowSecretModal(interaction) {
    try {
        const secretModalId = interaction.customId.replace('show_secret_modal_', '');
        
        if (!interaction.client.sendlinkData || !interaction.client.sendlinkData.has(secretModalId)) {
            return await interaction.reply({
                content: '❌ Data tidak ditemukan atau sudah expired!',
                ephemeral: true
            }).catch(() => {});
        }

        const secretModal = new ModalBuilder()
            .setCustomId(secretModalId)
            .setTitle(MESSAGES.PROTECTED_LINK.MODAL_SECRET_TITLE);

        const secretInput = new TextInputBuilder()
            .setCustomId('secret_message')
            .setLabel(MESSAGES.PROTECTED_LINK.MODAL_SECRET_LABEL)
            .setPlaceholder(MESSAGES.PROTECTED_LINK.MODAL_SECRET_PLACEHOLDER)
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(4000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(secretInput);
        secretModal.addComponents(row);

        await interaction.showModal(secretModal);

    } catch (error) {
        logger.error('Show secret modal error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Terjadi error!',
                ephemeral: true
            }).catch(() => {});
        }
    }
}

/**
 * Handler untuk button show edit secret modal (edit link step 2)
 */
export async function handleShowEditSecretModal(interaction) {
    try {
        const secretModalId = interaction.customId.replace('show_editsecret_modal_', '');
        
        if (!interaction.client.editlinkData || !interaction.client.editlinkData.has(secretModalId)) {
            return await interaction.reply({
                content: '❌ Data tidak ditemukan atau sudah expired!',
                ephemeral: true
            }).catch(() => {});
        }

        const data = interaction.client.editlinkData.get(secretModalId);

        const secretModal = new ModalBuilder()
            .setCustomId(secretModalId)
            .setTitle(MESSAGES.PROTECTED_LINK.MODAL_SECRET_TITLE);

        const secretInput = new TextInputBuilder()
            .setCustomId('secret_message')
            .setLabel(MESSAGES.PROTECTED_LINK.MODAL_SECRET_LABEL)
            .setPlaceholder('Edit pesan rahasia')
            .setValue(data.originalData.secretMessage)
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(4000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(secretInput);
        secretModal.addComponents(row);

        await interaction.showModal(secretModal);

    } catch (error) {
        logger.error('Show edit secret modal error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Terjadi error!',
                ephemeral: true
            }).catch(() => {});
        }
    }
}

/**
 * Handler untuk button confirm delete
 */
export async function handleConfirmDelete(interaction) {
    try {
        await interaction.deferUpdate();

        const messageId = interaction.customId.replace('confirm_delete_', '');
        
        const link = linkManager.getLink(messageId);
        if (!link) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_NOT_FOUND,
                embeds: [],
                components: []
            });
        }

        const channel = interaction.client.channels.cache.get(link.channelId);
        if (channel) {
            try {
                const message = await channel.messages.fetch(messageId);
                await message.delete();
            } catch (msgError) {
                logger.warn(`Failed to delete message ${messageId}:`, msgError);
            }
        }

        const result = linkManager.deleteLink(messageId);

        if (!result.success) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_DELETE_FAILED,
                embeds: [],
                components: []
            });
        }

        logger.success(MESSAGES.LOGGER.LINK_DELETED(
            interaction.user.tag,
            messageId
        ));

        return await interaction.editReply({
            content: MESSAGES.SUCCESS.LINK_DELETED,
            embeds: [],
            components: []
        });

    } catch (error) {
        logger.error('Confirm delete error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_DELETE_FAILED,
                embeds: [],
                components: []
            }).catch(() => {});
        }
    }
}

/**
 * Handler untuk button cancel delete
 */
export async function handleCancelDelete(interaction) {
    try {
        await interaction.deferUpdate();

        return await interaction.editReply({
            content: '✓ Penghapusan dibatalkan.',
            embeds: [],
            components: []
        });

    } catch (error) {
        logger.error('Cancel delete error:', error);
    }
}