import { 
    Events, 
    PermissionFlagsBits, 
    MessageFlags,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder
} from 'discord.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { checkPermissions } from '../utils/permissions.js';
import MESSAGES from '../constants/messages.js';
import ticketManager from '../utils/ticketManager.js';

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
        }

        // Handle Modal Submissions
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'ticket_modal') {
                await handleTicketModal(interaction);
            }
            
            // Handle sendmsg modal
            if (interaction.customId.startsWith('sendmsg_modal_')) {
                await handleSendmsgModal(interaction);
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
        // Cek jika user sudah punya ticket
        if (ticketManager.hasActiveTicket(interaction.user.id)) {
            return await interaction.reply({
                content: MESSAGES.ERROR.TICKET_ALREADY_EXISTS,
                flags: MessageFlags.Ephemeral
            });
        }

        // Buat modal untuk input kategori
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

        // Buat ticket
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

        // Konfirmasi penutupan ticket
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
        
        // Ambil data yang disimpan
        if (!interaction.client.sendmsgData || !interaction.client.sendmsgData.has(modalId)) {
            return await interaction.editReply({
                content: '❌ Data tidak ditemukan! Silakan coba lagi.'
            });
        }

        const data = interaction.client.sendmsgData.get(modalId);
        interaction.client.sendmsgData.delete(modalId);

        const { useEmbed, channelId } = data;
        const messageContent = interaction.fields.getTextInputValue('message_content');

        // Get target channel
        const targetChannel = interaction.guild.channels.cache.get(channelId);
        if (!targetChannel) {
            return await interaction.editReply({
                content: '❌ Channel tidak ditemukan!'
            });
        }

        // Cek bot permission
        const botPermissions = targetChannel.permissionsFor(interaction.client.user);
        if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
            return await interaction.editReply({
                content: MESSAGES.SENDMSG.ERROR_NO_PERMISSION
            });
        }

        if (useEmbed) {
            // Get optional fields
            const embedTitle = interaction.fields.getTextInputValue('embed_title') || null;
            const embedColorInput = interaction.fields.getTextInputValue('embed_color') || null;
            const embedImageUrl = interaction.fields.getTextInputValue('embed_image') || null;

            // Parse color
            let embedColor = 0x00FF00; // Default green
            if (embedColorInput) {
                const colorHex = embedColorInput.replace('#', '');
                if (!/^[0-9A-F]{6}$/i.test(colorHex)) {
                    return await interaction.editReply({
                        content: MESSAGES.SENDMSG.ERROR_INVALID_COLOR
                    });
                }
                embedColor = parseInt(colorHex, 16);
            }

            // Validate image URL if provided
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
                // .setFooter({ text: `Dikirim oleh ${interaction.user.tag}` });

            if (embedTitle) {
                embed.setTitle(embedTitle);
            }

            if (embedImageUrl) {
                embed.setImage(embedImageUrl);
            }

            await targetChannel.send({ embeds: [embed] });
        } else {
            // Kirim pesan biasa
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