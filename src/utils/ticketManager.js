import { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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

            // Send welcome message dengan tombol close
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(MESSAGES.TICKET.WELCOME_TITLE)
                .setDescription(MESSAGES.TICKET.WELCOME_DESCRIPTION(member, category))
                .setTimestamp()
                .setFooter({ text: `Ticket ID: ${ticketChannel.id}` });

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder()
                .addComponents(closeButton);

            await ticketChannel.send({
                content: `${member}`,
                embeds: [welcomeEmbed],
                components: [row]
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

    async closeTicket(channel, closedBy) {
        try {
            // Verifikasi channel ada di ticket category
            if (channel.parentId !== config.ticketCategoryId) {
                return {
                    success: false,
                    message: 'Channel ini bukan ticket channel!'
                };
            }

            // Cari dan hapus ticket dari Map jika ada
            let ticketOwnerId = null;
            for (const [id, ticket] of this.activeTickets.entries()) {
                if (ticket.channelId === channel.id) {
                    ticketOwnerId = id;
                    this.activeTickets.delete(id);
                    break;
                }
            }

            // Send closing message
            const closeEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Ticket Ditutup')
                .setDescription(`Ticket ditutup oleh ${closedBy}\nChannel akan dihapus dalam 5 detik...`)
                .setTimestamp();

            await channel.send({
                embeds: [closeEmbed]
            });

            logger.success(`Ticket closed by ${closedBy.tag} (Channel: ${channel.name})`);

            // Delete channel after 5 seconds
            setTimeout(async () => {
                try {
                    await channel.delete();
                } catch (error) {
                    logger.error('Error deleting channel:', error);
                }
            }, 5000);

            return {
                success: true,
                message: 'Ticket berhasil ditutup!'
            };

        } catch (error) {
            logger.error('Close ticket error:', error);
            return {
                success: false,
                message: 'Terjadi error saat menutup ticket!'
            };
        }
    }

    removeTicket(userId) {
        return this.activeTickets.delete(userId);
    }

    removeTicketByChannel(channelId) {
        for (const [userId, ticket] of this.activeTickets.entries()) {
            if (ticket.channelId === channelId) {
                this.activeTickets.delete(userId);
                logger.info(`Ticket data removed for channel: ${channelId}`);
                return true;
            }
        }
        return false;
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