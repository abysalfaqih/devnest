import { 
    Events, 
    PermissionFlagsBits, 
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { checkPermissions } from '../utils/permissions.js';
import MESSAGES from '../constants/messages.js';
import ticketManager from '../utils/ticketManager.js';
import linkManager from '../utils/linkManager.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                logger.error(`Command not found: ${interaction.commandName}`);
                return;
            }

            const permissionCheck = checkPermissions(interaction, {
                developer: command.developer || false,
                admin: command.admin || false
            });

            if (!permissionCheck.hasPermission) {
                return await interaction.reply({
                    content: permissionCheck.message,
                    flags: MessageFlags.Ephemeral
                });
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                logger.error(`Error executing ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: MESSAGES.ERROR.COMMAND_EXECUTION,
                    flags: MessageFlags.Ephemeral
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }

        // Handle Button Interactions
        if (interaction.isButton()) {
            if (interaction.customId === 'verify_button') {
                await handleVerification(interaction);
            }
            
            if (interaction.customId === 'create_ticket') {
                await handleTicketButton(interaction);
            }

            if (interaction.customId === 'close_ticket') {
                await handleCloseTicket(interaction);
            }

            // Protected Link Buttons
            if (interaction.customId.startsWith('access_link_')) {
                await handleAccessLinkButton(interaction);
            }

            if (interaction.customId.startsWith('confirm_delete_')) {
                await handleConfirmDelete(interaction);
            }

            if (interaction.customId.startsWith('cancel_delete_')) {
                await handleCancelDelete(interaction);
            }

            // DM Buttons for modal triggers
            if (interaction.customId.startsWith('show_secret_modal_')) {
                await handleShowSecretModal(interaction);
            }

            if (interaction.customId.startsWith('show_editsecret_modal_')) {
                await handleShowEditSecretModal(interaction);
            }
        }

        // Handle Modal Submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ticket_modal') {
                await handleTicketModal(interaction);
            }
            
            if (interaction.customId.startsWith('sendmsg_modal_')) {
                await handleSendmsgModal(interaction);
            }

            if (interaction.customId.startsWith('sendlink_modal_')) {
                await handleSendlinkModalStep1(interaction);
            }

            if (interaction.customId.startsWith('sendlink_secret_')) {
                await handleSendlinkModalStep2(interaction);
            }

            if (interaction.customId.startsWith('editlink_modal_')) {
                await handleEditlinkModal(interaction);
            }

            if (interaction.customId.startsWith('editlink_secret_')) {
                await handleEditlinkSecretModal(interaction);
            }

            if (interaction.customId.startsWith('password_check_')) {
                await handlePasswordCheck(interaction);
            }
        }
    }
};

async function handleVerification(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const member = interaction.member;
        const roleId = config.verifiedRoleId;

        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.ROLE_NOT_FOUND
            });
        }

        if (member.roles.cache.has(roleId)) {
            return await interaction.editReply({
                content: MESSAGES.SUCCESS.ALREADY_VERIFIED
            });
        }

        const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.BOT_NO_PERMISSION
            });
        }

        if (botMember.roles.highest.position <= role.position) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.BOT_ROLE_POSITION
            });
        }

        await member.roles.add(roleId);

        logger.success(`✓ ${member.user.tag} verified`);

        return await interaction.editReply({
            content: MESSAGES.SUCCESS.VERIFICATION_COMPLETE(role.name)
        });

    } catch (error) {
        logger.error('Verification error:', error);
        
        const replyOptions = {
            content: MESSAGES.ERROR.VERIFICATION_PROCESS
        };

        if (interaction.deferred) {
            return await interaction.editReply(replyOptions);
        } else {
            return await interaction.reply({ ...replyOptions, flags: MessageFlags.Ephemeral });
        }
    }
}

async function handleTicketButton(interaction) {
    try {
        if (ticketManager.hasActiveTicket(interaction.user.id)) {
            return await interaction.reply({
                content: MESSAGES.ERROR.TICKET_ALREADY_EXISTS,
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = new ModalBuilder()
            .setCustomId('ticket_modal')
            .setTitle(MESSAGES.TICKET.MODAL_TITLE);

        const categoryInput = new TextInputBuilder()
            .setCustomId('ticket_category')
            .setLabel(MESSAGES.TICKET.MODAL_LABEL)
            .setPlaceholder(MESSAGES.TICKET.MODAL_PLACEHOLDER)
            .setStyle(TextInputStyle.Short)
            .setMinLength(4)
            .setMaxLength(8)
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(categoryInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);

    } catch (error) {
        logger.error('Ticket button error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: MESSAGES.ERROR.TICKET_CREATION_FAILED,
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

async function handleTicketModal(interaction) {
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

async function handleCloseTicket(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const channel = interaction.channel;
        const user = interaction.user;

        const result = await ticketManager.closeTicket(channel, user);

        if (!result.success) {
            return await interaction.editReply({
                content: result.message
            });
        }

        return await interaction.editReply({
            content: result.message
        });

    } catch (error) {
        logger.error('Close ticket button error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: '❌ Terjadi error saat menutup ticket!'
            });
        }
    }
}

async function handleSendmsgModal(interaction) {
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

// ========== PROTECTED LINK HANDLERS ==========

async function handleSendlinkModalStep1(interaction) {
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

        const secretModal = new ModalBuilder()
            .setCustomId(secretModalId)
            .setTitle(MESSAGES.PROTECTED_LINK.MODAL_SECRET_TITLE);

        const secretInput = new TextInputBuilder()
            .setCustomId('secret_message')
            .setLabel(MESSAGES.PROTECTED_LINK.MODAL_SECRET_LABEL)
            .setPlaceholder(MESSAGES.PROTECTED_LINK.MODAL_SECRET_PLACEHOLDER)
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(4000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(secretInput);
        secretModal.addComponents(row);

        await interaction.followUp({
            content: '⏳ Lengkapi form kedua...',
            ephemeral: true
        });

        await interaction.editReply({
            content: '✅ Step 1 selesai! Silakan isi form yang muncul.',
        });

        setTimeout(async () => {
            try {
                await interaction.followUp({
                    content: 'Silakan isi pesan rahasia:',
                    ephemeral: true
                });
                
                await interaction.user.send({
                    content: 'Klik di sini untuk melanjutkan',
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`show_secret_modal_${secretModalId}`)
                                .setLabel('📝 Isi Pesan Rahasia')
                                .setStyle(ButtonStyle.Primary)
                        )
                    ]
                });
            } catch (dmError) {
                await interaction.followUp({
                    content: '❌ Gagal mengirim DM! Pastikan DM Anda terbuka.\n\nGunakan command `/sendlink` lagi.',
                    ephemeral: true
                });
                interaction.client.sendlinkData.delete(secretModalId);
            }
        }, 1000);

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

async function handleSendlinkModalStep2(interaction) {
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

async function handleAccessLinkButton(interaction) {
    try {
        const messageId = interaction.customId.replace('access_link_', '');
        
        const link = linkManager.getLink(messageId);
        if (!link) {
            return await interaction.reply({
                content: MESSAGES.ERROR.LINK_NOT_FOUND,
                flags: MessageFlags.Ephemeral
            });
        }

        const modal = new ModalBuilder()
            .setCustomId(`password_check_${messageId}`)
            .setTitle(MESSAGES.PROTECTED_LINK.MODAL_PASSWORD_TITLE);

        const passwordInput = new TextInputBuilder()
            .setCustomId('password_input')
            .setLabel(MESSAGES.PROTECTED_LINK.MODAL_PASSWORD_LABEL)
            .setPlaceholder(MESSAGES.PROTECTED_LINK.MODAL_PASSWORD_PLACEHOLDER)
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(100)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(passwordInput);
        modal.addComponents(row);

        await interaction.showModal(modal);

    } catch (error) {
        logger.error('Access link button error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Terjadi error!',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

async function handlePasswordCheck(interaction) {
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
            });
        }
    }
}

async function handleEditlinkModal(interaction) {
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

        const secretModal = new ModalBuilder()
            .setCustomId(secretModalId)
            .setTitle(MESSAGES.PROTECTED_LINK.MODAL_SECRET_TITLE);

        const secretInput = new TextInputBuilder()
            .setCustomId('secret_message')
            .setLabel(MESSAGES.PROTECTED_LINK.MODAL_SECRET_LABEL)
            .setPlaceholder('Kosongkan jika tidak ingin ubah pesan')
            .setValue(data.originalData.secretMessage)
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(4000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(secretInput);
        secretModal.addComponents(row);

        await interaction.followUp({
            content: '⏳ Lengkapi form kedua...',
            ephemeral: true
        });

        await interaction.editReply({
            content: '✅ Step 1 selesai! Silakan isi form yang muncul.',
        });

        setTimeout(async () => {
            try {
                await interaction.user.send({
                    content: 'Klik di sini untuk melanjutkan edit:',
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`show_editsecret_modal_${secretModalId}`)
                                .setLabel('📝 Edit Pesan Rahasia')
                                .setStyle(ButtonStyle.Primary)
                        )
                    ]
                });
            } catch (dmError) {
                await interaction.followUp({
                    content: '❌ Gagal mengirim DM! Pastikan DM Anda terbuka.',
                    ephemeral: true
                });
                interaction.client.editlinkData.delete(secretModalId);
            }
        }, 1000);

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
            });
        }
    }
}

async function handleEditlinkSecretModal(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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

        const channel = interaction.client.channels.cache.get(result.data.channelId);
        if (channel) {
            try {
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
            } catch (msgError) {
                logger.warn('Failed to update message:', msgError);
            }
        }

        logger.success(MESSAGES.LOGGER.LINK_UPDATED(
            interaction.user.tag,
            data.messageId
        ));

        return await interaction.editReply({
            content: MESSAGES.SUCCESS.LINK_UPDATED
        });

    } catch (error) {
        logger.error('Editlink secret modal error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_UPDATE_FAILED
            });
        }
    }
}

async function handleConfirmDelete(interaction) {
    try {
        await interaction.deferUpdate();

        const messageId = interaction.customId.replace('confirm_delete_', '');
        
        const link = linkManager.getLink(messageId);
        if (!link) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_NOT_FOUND,
                embeds: [],
                components: []
            });
        }

        const channel = interaction.client.channels.cache.get(link.channelId);
        if (channel) {
            try {
                const message = await channel.messages.fetch(messageId);
                await message.delete();
            } catch (msgError) {
                logger.warn(`Failed to delete message ${messageId}:`, msgError);
            }
        }

        const result = linkManager.deleteLink(messageId);

        if (!result.success) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_DELETE_FAILED,
                embeds: [],
                components: []
            });
        }

        logger.success(MESSAGES.LOGGER.LINK_DELETED(
            interaction.user.tag,
            messageId
        ));

        return await interaction.editReply({
            content: MESSAGES.SUCCESS.LINK_DELETED,
            embeds: [],
            components: []
        });

    } catch (error) {
        logger.error('Confirm delete error:', error);
        
        if (interaction.deferred) {
            return await interaction.editReply({
                content: MESSAGES.ERROR.LINK_DELETE_FAILED,
                embeds: [],
                components: []
            });
        }
    }
}

async function handleCancelDelete(interaction) {
    try {
        await interaction.deferUpdate();

        return await interaction.editReply({
            content: '✅ Penghapusan dibatalkan.',
            embeds: [],
            components: []
        });

    } catch (error) {
        logger.error('Cancel delete error:', error);
    }
}

async function handleShowSecretModal(interaction) {
    try {
        const secretModalId = interaction.customId.replace('show_secret_modal_', '');
        
        if (!interaction.client.sendlinkData || !interaction.client.sendlinkData.has(secretModalId)) {
            return await interaction.reply({
                content: '❌ Data tidak ditemukan atau sudah expired!',
                ephemeral: true
            });
        }

        const secretModal = new ModalBuilder()
            .setCustomId(secretModalId)
            .setTitle(MESSAGES.PROTECTED_LINK.MODAL_SECRET_TITLE);

        const secretInput = new TextInputBuilder()
            .setCustomId('secret_message')
            .setLabel(MESSAGES.PROTECTED_LINK.MODAL_SECRET_LABEL)
            .setPlaceholder(MESSAGES.PROTECTED_LINK.MODAL_SECRET_PLACEHOLDER)
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(4000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(secretInput);
        secretModal.addComponents(row);

        await interaction.showModal(secretModal);

    } catch (error) {
        logger.error('Show secret modal error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Terjadi error!',
                ephemeral: true
            });
        }
    }
}

async function handleShowEditSecretModal(interaction) {
    try {
        const secretModalId = interaction.customId.replace('show_editsecret_modal_', '');
        
        if (!interaction.client.editlinkData || !interaction.client.editlinkData.has(secretModalId)) {
            return await interaction.reply({
                content: '❌ Data tidak ditemukan atau sudah expired!',
                ephemeral: true
            });
        }

        const data = interaction.client.editlinkData.get(secretModalId);

        const secretModal = new ModalBuilder()
            .setCustomId(secretModalId)
            .setTitle(MESSAGES.PROTECTED_LINK.MODAL_SECRET_TITLE);

        const secretInput = new TextInputBuilder()
            .setCustomId('secret_message')
            .setLabel(MESSAGES.PROTECTED_LINK.MODAL_SECRET_LABEL)
            .setPlaceholder('Kosongkan jika tidak ingin ubah pesan')
            .setValue(data.originalData.secretMessage)
            .setStyle(TextInputStyle.Paragraph)
            .setMinLength(10)
            .setMaxLength(4000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(secretInput);
        secretModal.addComponents(row);

        await interaction.showModal(secretModal);

    } catch (error) {
        logger.error('Show edit secret modal error:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Terjadi error!',
                ephemeral: true
            });
        }
    }
}