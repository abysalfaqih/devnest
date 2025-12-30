import { verificationHandlers } from './verification/index.js';
import { ticketHandlers } from './tickets/index.js';
import { messageHandlers } from './messages/index.js';
import { linkHandlers } from './links/index.js';

/**
 * Central Router untuk semua interactions
 * Delegasi ke handler yang sesuai berdasarkan type dan customId
 */
export async function handleInteraction(interaction) {
    try {
        // Handle Button Interactions
        if (interaction.isButton()) {
            const customId = interaction.customId;

            // Verification
            if (customId === 'verify_button') {
                return await verificationHandlers.handleVerification(interaction);
            }

            // Tickets
            if (customId === 'create_ticket') {
                return await ticketHandlers.handleTicketButton(interaction);
            }
            if (customId === 'close_ticket') {
                return await ticketHandlers.handleCloseTicket(interaction);
            }

            // Links - Access & Modals
            if (customId.startsWith('access_link_')) {
                return await linkHandlers.handleAccessLinkButton(interaction);
            }
            if (customId.startsWith('show_secret_modal_')) {
                return await linkHandlers.handleShowSecretModal(interaction);
            }
            if (customId.startsWith('show_editsecret_modal_')) {
                return await linkHandlers.handleShowEditSecretModal(interaction);
            }

            // Links - Delete Confirmation
            if (customId.startsWith('confirm_delete_')) {
                return await linkHandlers.handleConfirmDelete(interaction);
            }
            if (customId.startsWith('cancel_delete_')) {
                return await linkHandlers.handleCancelDelete(interaction);
            }
        }

        // Handle Modal Submissions
        if (interaction.isModalSubmit()) {
            const customId = interaction.customId;

            // Tickets
            if (customId === 'ticket_modal') {
                return await ticketHandlers.handleTicketModal(interaction);
            }

            // Messages
            if (customId.startsWith('sendmsg_modal_')) {
                return await messageHandlers.handleSendmsgModal(interaction);
            }

            // Links - Create & Edit
            if (customId.startsWith('sendlink_modal_')) {
                return await linkHandlers.handleSendlinkModalStep1(interaction);
            }
            if (customId.startsWith('sendlink_secret_')) {
                return await linkHandlers.handleSendlinkModalStep2(interaction);
            }
            if (customId.startsWith('editlink_modal_')) {
                return await linkHandlers.handleEditlinkModal(interaction);
            }
            if (customId.startsWith('editlink_secret_')) {
                return await linkHandlers.handleEditlinkSecretModal(interaction);
            }

            // Links - Password Check
            if (customId.startsWith('password_check_')) {
                return await linkHandlers.handlePasswordCheck(interaction);
            }
        }

    } catch (error) {
        throw error; // Propagate ke interactionCreate event
    }
}

export default handleInteraction;