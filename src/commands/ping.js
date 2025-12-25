import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { showProgress, completeProgress } from '../utils/progressIndicator.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Cek latency bot dan status'),
    
    developer: false,
    admin: false,
    
    async execute(interaction) {
        try {
            await showProgress(interaction, true, '🏓 Pinging...');

            const sent = Date.now();
            const apiLatency = Math.round(interaction.client.ws.ping);
            const botLatency = Date.now() - sent;

            const uptime = process.uptime();
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);

            const rateLimitStats = interaction.client.rateLimiter.getStats();

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🏓 Pong!')
                .addFields(
                    { 
                        name: '📡 API Latency', 
                        value: `${apiLatency}ms`, 
                        inline: true 
                    },
                    { 
                        name: '🤖 Bot Latency', 
                        value: `${botLatency}ms`, 
                        inline: true 
                    },
                    { 
                        name: '⏱️ Uptime', 
                        value: `${hours}h ${minutes}m ${seconds}s`, 
                        inline: true 
                    },
                    {
                        name: '📊 Rate Limit Stats',
                        value: `Active Users: ${rateLimitStats.activeUsers}\nQueue: ${rateLimitStats.queueSize}`,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.tag}` });

            await interaction.editReply({
                content: null,
                embeds: [embed]
            });

        } catch (error) {
            console.error('Error in ping command:', error);
            await completeProgress(
                interaction,
                '❌ Terjadi error saat mengecek ping!',
                false
            );
        }
    }
};