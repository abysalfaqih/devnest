import { Events } from 'discord.js';
import config from '../config/config.js';
import ticketManager from '../utils/ticketManager.js';
import logger from '../utils/logger.js';

export default {
    name: Events.ChannelDelete,
    async execute(channel) {
        try {
            // Cek apakah channel yang dihapus adalah ticket channel
            if (channel.parentId === config.ticketCategoryId) {
                // Hapus data ticket dari Map
                const removed = ticketManager.removeTicketByChannel(channel.id);
                
                if (removed) {
                    logger.info(`Ticket channel deleted: ${channel.name} (ID: ${channel.id})`);
                }
            }
        } catch (error) {
            logger.error('Error in channelDelete event:', error);
        }
    }
};