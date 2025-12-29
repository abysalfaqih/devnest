import { Events, REST, Routes } from 'discord.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logger.success(`✓ ${client.user.tag} online`);
        
        const commands = [];
        client.commands.forEach(command => {
            commands.push(command.data.toJSON());
        });

        const rest = new REST().setToken(config.token);

        try {
            await rest.put(
                Routes.applicationGuildCommands(config.clientId, config.guildId),
                { body: commands }
            );
            
            logger.success(`✓ ${commands.length} slash commands registered`);
        } catch (error) {
            logger.error('Failed to register commands:', error);
        }
    }
};