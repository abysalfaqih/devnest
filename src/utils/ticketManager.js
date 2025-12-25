import { ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import config from '../config/config.js';
import logger from './logger.js';
import MESSAGES from '../constants/messages.js';

class TicketManager {
    constructor() {
        this.activeTickets = new Map();
    }

    hasActiveTicket(userId) {
        return this.activeTickets.has(userId);
    }

    async createTicket(interaction, category) {
        try {
            const guild = interaction.guild;
            const member = interaction.member;
            const userId = member.id;

            // Cek jika user sudah punya ticket aktif
            if (this.hasActiveTicket(userId)) {
                return {
                    success: false,
                    message: MESSAGES.ERROR.TICKET_ALREADY_EXISTS
                };
            }

            // Get ticket category
            const ticketCategory = guild.channels.cache.get(config.ticketCategoryId);
            if (!ticketCategory) {
                return {
                    success: false,
                    message: MESSAGES.ERROR.TICKET_CATEGORY_NOT_FOUND
                };
            }

            // Buat nama channel dari username (lowercase, no spaces)
            const channelName = member.user.username
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-');

            // Buat ticket channel
            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: ticketCategory.id,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: member.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles,
                            PermissionFlagsBits.EmbedLinks,
                        ],
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageMessages,
                        ],
                    },
                ],
            });

            // Simpan info ticket
            this.activeTickets.set(userId, {
                channelId: ticketChannel.id,
                category: category,
                createdAt: Date.now()
            });

            // Send welcome message
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(MESSAGES.TICKET.WELCOME_TITLE)
                .setDescription(MESSAGES.TICKET.WELCOME_DESCRIPTION(member, category))
                .setTimestamp()
                .setFooter({ text: `Ticket ID: ${ticketChannel.id}` });

            await ticketChannel.send({
                content: `${member}`,
                embeds: [welcomeEmbed]
            });

            logger.success(MESSAGES.LOGGER.TICKET_CREATED(
                member.user.tag,
                ticketChannel.name,
                category
            ));

            return {
                success: true,
                channel: ticketChannel,
                message: MESSAGES.SUCCESS.TICKET_CREATED(ticketChannel)
            };

        } catch (error) {
            logger.error('Ticket creation error:', error);
            return {
                success: false,
                message: MESSAGES.ERROR.TICKET_CREATION_FAILED
            };
        }
    }

    removeTicket(userId) {
        return this.activeTickets.delete(userId);
    }

    getTicketInfo(userId) {
        return this.activeTickets.get(userId);
    }

    getActiveTicketsCount() {
        return this.activeTickets.size;
    }

    getAllTickets() {
        return Array.from(this.activeTickets.entries());
    }
}

export const ticketManager = new TicketManager();
export default ticketManager;