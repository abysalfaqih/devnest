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
            await showProgress(interaction, true, '⏳ Setting up ticket panel...');

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(MESSAGES.TICKET.PANEL_TITLE)
                .setDescription(MESSAGES.TICKET.PANEL_DESCRIPTION)
                .setTimestamp();

            const button = new ButtonBuilder()
                .setCustomId('create_ticket')
                .setLabel(MESSAGES.TICKET.BUTTON_LABEL)
                .setEmoji('🛒')
                .setStyle(ButtonStyle.Primary);

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