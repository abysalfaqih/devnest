import { Events, MessageFlags } from 'discord.js';
import logger from '../utils/logger.js';
import { checkPermissions } from '../utils/permissions.js';
import MESSAGES from '../constants/messages.js';
import { handleInteraction } from '../interactions/index.js';

/**
 * Event handler untuk semua interactions (Command, Button, Modal)
 * Refactored untuk lebih modular dan maintainable
 */
export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // ========== SLASH COMMANDS ==========
        if (interaction.isChatInputCommand()) {
            return await handleSlashCommand(interaction);
        }

        // ========== BUTTON & MODAL INTERACTIONS ==========
        if (interaction.isButton() || interaction.isModalSubmit()) {
            return await handleInteraction(interaction);
        }
    }
};

/**
 * Handler untuk slash commands
 */
async function handleSlashCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        logger.error(`Command not found: ${interaction.commandName}`);
        return;
    }

    // Check permissions
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

    // Execute command
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