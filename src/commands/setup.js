import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import MESSAGES from '../constants/messages.js';
import { showProgress, completeProgress } from '../utils/progressIndicator.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup embed verifikasi'),
    
    developer: false,
    admin: true,
    
    async execute(interaction) {
        try {
            await showProgress(interaction, true, '⏳ Setting up...');

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(MESSAGES.VERIFICATION.TITLE)
                .setDescription(MESSAGES.VERIFICATION.DESCRIPTION)
                .setTimestamp();

            const button = new ButtonBuilder()
                .setCustomId('verify_button')
                .setLabel(MESSAGES.VERIFICATION.BUTTON_LABEL)
                .setStyle(ButtonStyle.Success);

            const row = new ActionRowBuilder()
                .addComponents(button);

            const channelId = config.verificationChannelId;
            const channel = interaction.guild.channels.cache.get(channelId);

            if (!channel) {
                return await completeProgress(
                    interaction,
                    MESSAGES.ERROR.CHANNEL_NOT_FOUND,
                    false
                );
            }

            await channel.send({
                embeds: [embed],
                components: [row]
            });

            logger.success(`✓ Setup by ${interaction.user.tag}`);

            return await completeProgress(
                interaction,
                MESSAGES.SUCCESS.SETUP_COMPLETE(channel),
                true
            );

        } catch (error) {
            logger.error('Setup error:', error);
            return await completeProgress(
                interaction,
                MESSAGES.ERROR.SETUP_EMBED,
                false
            );
        }
    }
};