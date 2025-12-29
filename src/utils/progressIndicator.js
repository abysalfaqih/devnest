import { MessageFlags } from 'discord.js';

/**
 * Progress Indicator Utility
 * Untuk menampilkan loading state ke user
 */

export const PROGRESS_EMOJIS = {
    LOADING: '⏳',
    PROCESSING: '🔄',
    SUCCESS: '✅',
    ERROR: '❌',
    WARNING: '⚠️',
    INFO: 'ℹ️'
};

export const PROGRESS_MESSAGES = {
    PROCESSING: 'Memproses permintaan...',
    VERIFYING: 'Sedang memverifikasi...',
    SETTING_UP: 'Sedang setup sistem...',
    LOADING: 'Loading...',
    CHECKING: 'Mengecek data...',
    SAVING: 'Menyimpan data...'
};

/**
 * Menampilkan progress indicator saat defer reply
 * @param {Interaction} interaction - Discord interaction
 * @param {boolean} ephemeral - Apakah reply ephemeral
 * @param {string} message - Custom message (optional)
 */
export async function showProgress(interaction, ephemeral = true, message = PROGRESS_MESSAGES.PROCESSING) {
    if (interaction.deferred || interaction.replied) {
        return false;
    }
    
    try {
        const options = { content: message };
        
        if (ephemeral) {
            options.flags = MessageFlags.Ephemeral;
        }
        
        await interaction.deferReply(options);
        return true;
    } catch (error) {
        console.error('Error showing progress:', error);
        return false;
    }
}

/**
 * Update progress message
 * @param {Interaction} interaction - Discord interaction
 * @param {string} message - New message
 */
export async function updateProgress(interaction, message) {
    if (!interaction.deferred) {
        return false;
    }
    
    try {
        await interaction.editReply({ content: message });
        return true;
    } catch (error) {
        console.error('Error updating progress:', error);
        return false;
    }
}

/**
 * Complete progress dengan hasil
 * @param {Interaction} interaction - Discord interaction
 * @param {string} message - Final message
 * @param {boolean} success - Apakah sukses
 */
export async function completeProgress(interaction, message, success = true) {
    const emoji = success ? PROGRESS_EMOJIS.SUCCESS : PROGRESS_EMOJIS.ERROR;
    const finalMessage = `${emoji} ${message}`;
    
    try {
        if (interaction.deferred) {
            await interaction.editReply({ content: finalMessage });
        } else {
            await interaction.reply({ 
                content: finalMessage, 
                flags: MessageFlags.Ephemeral 
            });
        }
        return true;
    } catch (error) {
        console.error('Error completing progress:', error);
        return false;
    }
}

export default {
    showProgress,
    updateProgress,
    completeProgress,
    PROGRESS_EMOJIS,
    PROGRESS_MESSAGES
};