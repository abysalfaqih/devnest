import { Events, PermissionFlagsBits, MessageFlags } from 'discord.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';
import { checkPermissions } from '../utils/permissions.js';
import MESSAGES from '../constants/messages.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
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

        if (interaction.isButton()) {
            if (interaction.customId === 'verify_button') {
                await handleVerification(interaction);
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