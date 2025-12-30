import { MessageFlags, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import logger from '../../utils/logger.js';
import MESSAGES from '../../constants/messages.js';

/**
 * Handler untuk sendmsg modal submission
 */
export async function handleSendmsgModal(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const modalId = interaction.customId;
        
        if (!interaction.client.sendmsgData || !interaction.client.sendmsgData.has(modalId)) {
            return await interaction.editReply({
                content: '❌ Data tidak ditemukan! Silakan coba lagi.'
            });
        }

        const data = interaction.client.sendmsgData.get(modalId);
        interaction.client.sendmsgData.delete(modalId);

        const { useEmbed, channelId } = data;
        const messageContent = interaction.fields.getTextInputValue('message_content');

        const targetChannel = interaction.guild.channels.cache.get(channelId);
        if (!targetChannel) {
            return await interaction.editReply({
                content: '❌ Channel tidak ditemukan!'
            });
        }

        const botPermissions = targetChannel.permissionsFor(interaction.client.user);
        if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
            return await interaction.editReply({
                content: MESSAGES.SENDMSG.ERROR_NO_PERMISSION
            });
        }

        if (useEmbed) {
            const embedTitle = interaction.fields.getTextInputValue('embed_title') || null;
            const embedColorInput = interaction.fields.getTextInputValue('embed_color') || null;
            const embedImageUrl = interaction.fields.getTextInputValue('embed_image') || null;

            let embedColor = 0x00FF00;
            if (embedColorInput) {
                const colorHex = embedColorInput.replace('#', '');
                if (!/^[0-9A-F]{6}$/i.test(colorHex)) {
                    return await interaction.editReply({
                        content: MESSAGES.SENDMSG.ERROR_INVALID_COLOR
                    });
                }
                embedColor = parseInt(colorHex, 16);
            }

            if (embedImageUrl) {
                const urlPattern = /^https?:\/\/.+/i;
                if (!urlPattern.test(embedImageUrl)) {
                    return await interaction.editReply({
                        content: MESSAGES.SENDMSG.ERROR_INVALID_IMAGE_URL
                    });
                }
            }

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setDescription(messageContent)
                .setTimestamp()
                .setFooter({ text: `Devnest` });

            if (embedTitle) {
                embed.setTitle(embedTitle);
            }

            if (embedImageUrl) {
                embed.setImage(embedImageUrl);
            }

            await targetChannel.send({ embeds: [embed] });
        } else {
            await targetChannel.send(messageContent);
        }

        logger.success(MESSAGES.LOGGER.MESSAGE_SENT(
            interaction.user.tag,
            targetChannel.name,
            useEmbed
        ));

        return await interaction.editReply({
            content: MESSAGES.SENDMSG.SUCCESS(targetChannel)
        });

    } catch (error) {
        logger.error('Sendmsg modal error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: MESSAGES.SENDMSG.ERROR_SEND
            });
        }
    }
}