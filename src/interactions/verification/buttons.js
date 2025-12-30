import { PermissionFlagsBits, MessageFlags } from 'discord.js';
import config from '../../config/config.js';
import logger from '../../utils/logger.js';
import MESSAGES from '../../constants/messages.js';

/**
 * Handler untuk button verifikasi
 */
export async function handleVerification(interaction) {
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