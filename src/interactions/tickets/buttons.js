import { 
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from 'discord.js';
import logger from '../../utils/logger.js';
import MESSAGES from '../../constants/messages.js';
import ticketManager from '../../utils/ticketManager.js';

/**
 * Handler untuk button create ticket
 */
export async function handleTicketButton(interaction) {
    try {
        if (ticketManager.hasActiveTicket(interaction.user.id)) {
            return await interaction.reply({
                content: MESSAGES.ERROR.TICKET_ALREADY_EXISTS,
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('ticket_modal')
            .setTitle(MESSAGES.TICKET.MODAL_TITLE);

        const categoryInput = new TextInputBuilder()
            .setCustomId('ticket_category')
            .setLabel(MESSAGES.TICKET.MODAL_LABEL)
            .setPlaceholder(MESSAGES.TICKET.MODAL_PLACEHOLDER)
            .setStyle(TextInputStyle.Short)
            .setMinLength(4)
            .setMaxLength(8)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(categoryInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);

    } catch (error) {
        logger.error('Ticket button error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: MESSAGES.ERROR.TICKET_CREATION_FAILED,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

/**
 * Handler untuk button close ticket
 */
export async function handleCloseTicket(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.channel;
        const user = interaction.user;

        const result = await ticketManager.closeTicket(channel, user);

        if (!result.success) {
            return await interaction.editReply({
                content: result.message
            });
        }

        return await interaction.editReply({
            content: result.message
        });

    } catch (error) {
        logger.error('Close ticket button error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: '❌ Terjadi error saat menutup ticket!'
            });
        }
    }
}