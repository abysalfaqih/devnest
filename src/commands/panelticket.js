import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import MESSAGES from '../constants/messages.js';
import { showProgress, completeProgress } from '../utils/progressIndicator.js';

export default {
    data: new SlashCommandBuilder()
        .setName('panelticket')
        .setDescription('Setup panel ticket untuk pemesanan'),
    
    developer: false,
    admin: true,
    
    async execute(interaction) {
        try {
            await showProgress(interaction, true, 'Setting up ticket panel...');

            const embed = new EmbedBuilder()
                .setColor(0xff6600)
                .setTitle(MESSAGES.TICKET.PANEL_TITLE)
                .setDescription(MESSAGES.TICKET.PANEL_DESCRIPTION)
                .setImage('https://cdn.discordapp.com/attachments/1352683805340860438/1454452601083920537/Ticket_MSG.png?ex=6951240a&is=694fd28a&hm=7a97cb7c9990717af9b3cd8dd9fe9e66e2592b322e19bd1e2116bd40eae142d3&')
                .setTimestamp();

            const button = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel(MESSAGES.TICKET.BUTTON_LABEL)
                .setEmoji('🛒')
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder()
                .addComponents(button);

            const channelId = config.ticketChannelId;
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return await completeProgress(
                    interaction,
                    MESSAGES.ERROR.TICKET_CHANNEL_NOT_FOUND,
                    false
                );
            }

            await channel.send({
                embeds: [embed],
                components: [row]
            });

            logger.success(MESSAGES.LOGGER.PANEL_TICKET_SETUP(
                channel.name,
                interaction.user.tag
            ));

            return await completeProgress(
                interaction,
                MESSAGES.SUCCESS.PANEL_TICKET_SETUP(channel),
                true
            );

        } catch (error) {
            logger.error('Panel ticket setup error:', error);
            return await completeProgress(
                interaction,
                MESSAGES.ERROR.SETUP_EMBED,
                false
            );
        }
    }
};