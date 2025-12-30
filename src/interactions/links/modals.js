import {
    MessageFlags,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import logger from '../../utils/logger.js';
import MESSAGES from '../../constants/messages.js';
import linkManager from '../../utils/linkManager.js';

/**
 * Handler untuk create link - Step 1 (embed info)
 */
export async function handleSendlinkModalStep1(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const modalId = interaction.customId;
        
        if (!interaction.client.sendlinkData || !interaction.client.sendlinkData.has(modalId)) {
            return await interaction.editReply({
                content: '❌ Data tidak ditemukan! Silakan coba lagi.'
            });
        }

        const data = interaction.client.sendlinkData.get(modalId);

        const embedTitle = interaction.fields.getTextInputValue('embed_title');
        const embedDescription = interaction.fields.getTextInputValue('embed_description');
        const embedImage = interaction.fields.getTextInputValue('embed_image') || null;
        const buttonLabel = interaction.fields.getTextInputValue('button_label');
        const password = interaction.fields.getTextInputValue('password');

        if (embedImage) {
            const urlPattern = /^https?:\/\/.+/i;
            if (!urlPattern.test(embedImage)) {
                interaction.client.sendlinkData.delete(modalId);
                return await interaction.editReply({
                    content: MESSAGES.ERROR.INVALID_IMAGE_URL
                });
            }
        }

        const secretModalId = `sendlink_secret_${interaction.user.id}_${Date.now()}`;
        
        interaction.client.sendlinkData.set(secretModalId, {
            ...data,
            embedTitle,
            embedDescription,
            embedImage,
            buttonLabel,
            password
        });
        
        interaction.client.sendlinkData.delete(modalId);

        await interaction.editReply({
            content: '**Next Steps:**',
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`show_secret_modal_${secretModalId}`)
                        .setLabel('Isi Pesan')
                        .setStyle(ButtonStyle.Primary)
                )
            ]
        });

        setTimeout(() => {
            if (interaction.client.sendlinkData) {
                interaction.client.sendlinkData.delete(secretModalId);
            }
        }, 300000);

    } catch (error) {
        logger.error('Sendlink modal step 1 error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_CREATION_FAILED
            });
        }
    }
}

/**
 * Handler untuk create link - Step 2 (secret message)
 */
export async function handleSendlinkModalStep2(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const modalId = interaction.customId;
        
        if (!interaction.client.sendlinkData || !interaction.client.sendlinkData.has(modalId)) {
            return await interaction.editReply({
                content: '❌ Data tidak ditemukan atau sudah expired!'
            });
        }

        const data = interaction.client.sendlinkData.get(modalId);
        interaction.client.sendlinkData.delete(modalId);

        const secretMessage = interaction.fields.getTextInputValue('secret_message');

        const targetChannel = interaction.client.channels.cache.get(data.channelId);
        if (!targetChannel) {
            return await interaction.editReply({
                content: '❌ Channel tidak ditemukan!'
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0xff6600)
            .setTitle(data.embedTitle)
            .setDescription(data.embedDescription)
            .setFooter({ text: '© Devnest' })
            .setTimestamp();

        if (data.embedImage) {
            embed.setImage(data.embedImage);
        }

        const button = new ButtonBuilder()
            .setCustomId(`access_link_temp`)
            .setLabel(data.buttonLabel)
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const message = await targetChannel.send({
            embeds: [embed],
            components: [row]
        });

        button.setCustomId(`access_link_${message.id}`);
        await message.edit({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(button)]
        });

        const linkData = {
            messageId: message.id,
            guildId: data.guildId,
            channelId: data.channelId,
            embedTitle: data.embedTitle,
            embedDescription: data.embedDescription,
            embedImage: data.embedImage,
            buttonLabel: data.buttonLabel,
            password: data.password,
            secretMessage: secretMessage,
            createdBy: data.userId
        };

        const result = await linkManager.createLink(linkData);

        if (!result.success) {
            await message.delete();
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_CREATION_FAILED
            });
        }

        logger.success(MESSAGES.LOGGER.LINK_CREATED(
            interaction.user.tag,
            targetChannel.name,
            data.embedTitle
        ));

        return await interaction.editReply({
            content: MESSAGES.SUCCESS.LINK_CREATED(targetChannel)
        });

    } catch (error) {
        logger.error('Sendlink modal step 2 error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_CREATION_FAILED
            });
        }
    }
}

/**
 * Handler untuk password check modal
 */
export async function handlePasswordCheck(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const messageId = interaction.customId.replace('password_check_', '');
        const passwordInput = interaction.fields.getTextInputValue('password_input');

        const result = await linkManager.verifyLinkPassword(messageId, passwordInput);

        if (!result.success) {
            logger.warn(MESSAGES.LOGGER.LINK_ACCESS_FAILED(
                interaction.user.tag,
                'Unknown'
            ));

            return await interaction.editReply({
                content: MESSAGES.ERROR.INVALID_PASSWORD
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(MESSAGES.PROTECTED_LINK.SECRET_EMBED_TITLE)
            .setDescription(
                MESSAGES.PROTECTED_LINK.SECRET_EMBED_DESCRIPTION(result.embedTitle) +
                '\n\n' +
                result.secretMessage
            )
            .setFooter({ text: MESSAGES.PROTECTED_LINK.SECRET_EMBED_FOOTER })
            .setTimestamp();

        logger.success(MESSAGES.LOGGER.LINK_ACCESSED(
            interaction.user.tag,
            result.embedTitle
        ));

        return await interaction.editReply({
            content: null,
            embeds: [embed]
        });

    } catch (error) {
        logger.error('Password check error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: '❌ Terjadi error saat verifikasi password!'
            }).catch(() => {});
        }
    }
}

/**
 * Handler untuk edit link - Step 1 (embed info)
 */
export async function handleEditlinkModal(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const modalId = interaction.customId;
        
        if (!interaction.client.editlinkData || !interaction.client.editlinkData.has(modalId)) {
            return await interaction.editReply({
                content: '❌ Data tidak ditemukan!'
            });
        }

        const data = interaction.client.editlinkData.get(modalId);

        const embedTitle = interaction.fields.getTextInputValue('embed_title');
        const embedDescription = interaction.fields.getTextInputValue('embed_description');
        const embedImage = interaction.fields.getTextInputValue('embed_image') || null;
        const buttonLabel = interaction.fields.getTextInputValue('button_label');
        const newPassword = interaction.fields.getTextInputValue('password') || null;

        if (embedImage) {
            const urlPattern = /^https?:\/\/.+/i;
            if (!urlPattern.test(embedImage)) {
                interaction.client.editlinkData.delete(modalId);
                return await interaction.editReply({
                    content: MESSAGES.ERROR.INVALID_IMAGE_URL
                });
            }
        }

        const secretModalId = `editlink_secret_${interaction.user.id}_${Date.now()}`;
        
        interaction.client.editlinkData.set(secretModalId, {
            ...data,
            embedTitle,
            embedDescription,
            embedImage,
            buttonLabel,
            newPassword
        });
        
        interaction.client.editlinkData.delete(modalId);

        await interaction.editReply({
            content: '**Next Steps:**',
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`show_editsecret_modal_${secretModalId}`)
                        .setLabel('Edit Pesan')
                        .setStyle(ButtonStyle.Primary)
                )
            ]
        });

        setTimeout(() => {
            if (interaction.client.editlinkData) {
                interaction.client.editlinkData.delete(secretModalId);
            }
        }, 300000);

    } catch (error) {
        logger.error('Editlink modal error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_UPDATE_FAILED
            }).catch(() => {});
        }
    }
}

/**
 * Handler untuk edit link - Step 2 (secret message)
 */
export async function handleEditlinkSecretModal(interaction) {
    try {
        const isDM = !interaction.guild;
        
        if (isDM) {
            await interaction.deferReply();
        } else {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        }

        const modalId = interaction.customId;
        
        if (!interaction.client.editlinkData || !interaction.client.editlinkData.has(modalId)) {
            return await interaction.editReply({
                content: '❌ Data tidak ditemukan atau sudah expired!'
            });
        }

        const data = interaction.client.editlinkData.get(modalId);
        interaction.client.editlinkData.delete(modalId);

        const secretMessage = interaction.fields.getTextInputValue('secret_message');

        const updates = {
            embedTitle: data.embedTitle,
            embedDescription: data.embedDescription,
            embedImage: data.embedImage,
            buttonLabel: data.buttonLabel,
            secretMessage: secretMessage
        };

        if (data.newPassword) {
            updates.password = data.newPassword;
        }

        const result = await linkManager.updateLink(data.messageId, updates);

        if (!result.success) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_UPDATE_FAILED
            });
        }

        try {
            const channel = interaction.client.channels.cache.get(result.data.channelId);
            if (channel) {
                const message = await channel.messages.fetch(data.messageId);
                
                const embed = new EmbedBuilder()
                    .setColor(0xff6600)
                    .setTitle(result.data.embedTitle)
                    .setDescription(result.data.embedDescription)
                    .setFooter({ text: '© Devnest' })
                    .setTimestamp();

                if (result.data.embedImage) {
                    embed.setImage(result.data.embedImage);
                }

                const button = new ButtonBuilder()
                    .setCustomId(`access_link_${data.messageId}`)
                    .setLabel(result.data.buttonLabel)
                    .setStyle(ButtonStyle.Primary);

                const row = new ActionRowBuilder().addComponents(button);

                await message.edit({
                    embeds: [embed],
                    components: [row]
                });
                
                logger.success(MESSAGES.LOGGER.LINK_UPDATED(
                    interaction.user.tag,
                    data.messageId
                ));
            }
        } catch (msgError) {
            logger.warn('Failed to update message:', msgError);
        }

        return await interaction.editReply({
            content: MESSAGES.SUCCESS.LINK_UPDATED
        });

    } catch (error) {
        logger.error('Editlink secret modal error:', error);
        
        try {
            if (interaction.deferred) {
                return await interaction.editReply({
                    content: MESSAGES.ERROR.LINK_UPDATE_FAILED
                });
            }
        } catch (replyError) {
            logger.error('Failed to send error reply:', replyError);
        }
    }
}