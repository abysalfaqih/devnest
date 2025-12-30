import { MessageFlags } from 'discord.js';
import logger from '../../utils/logger.js';
import MESSAGES from '../../constants/messages.js';
import ticketManager from '../../utils/ticketManager.js';

/**
 * Handler untuk modal submission ticket
 */
export async function handleTicketModal(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const category = interaction.fields.getTextInputValue('ticket_category');
        const result = await ticketManager.createTicket(interaction, category);

        if (!result.success) {
            return await interaction.editReply({
                content: result.message
            });
        }

        return await interaction.editReply({
            content: result.message
        });

    } catch (error) {
        logger.error('Ticket modal error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.TICKET_CREATION_FAILED
            });
        }
    }
}