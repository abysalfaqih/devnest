import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { loadCommands } from './src/handlers/commandHandler.js';
import { loadEvents } from './src/handlers/eventHandler.js';
import logger from './src/utils/logger.js';
import shutdownHandler from './src/utils/shutdown.js';
import rateLimiter from './src/utils/rateLimit.js';
import ticketManager from './src/utils/ticketManager.js';
import linkManager from './src/utils/linkManager.js';

dotenv.config();

const requiredEnvVars = [
    'DISCORD_TOKEN',
    'CLIENT_ID',
    'GUILD_ID',
    'VERIFIED_ROLE_ID',
    'VERIFICATION_CHANNEL_ID',
    'TICKET_CHANNEL_ID',
    'TICKET_CATEGORY_ID',
    'DEVELOPER',
    'ADMIN'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    logger.error('Missing env variables:', missingVars.join(', '));
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ]
});

client.commands = new Collection();
client.rateLimiter = rateLimiter;
client.ticketManager = ticketManager;
client.linkManager = linkManager;

async function initialize() {
    try {
        await loadCommands(client);
        await loadEvents(client);
        
        shutdownHandler.initialize(client);
        shutdownHandler.registerTask(async () => {
            rateLimiter.clearLimits();
        }, 'Cleanup Rate Limiter');

        shutdownHandler.registerTask(async () => {
            linkManager.saveLinks();
        }, 'Save Protected Links');

        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        logger.error('Initialization failed:', error);
        process.exit(1);
    }
}

client.on('error', error => {
    logger.error('Client error:', error);
});

client.on('warn', warning => {
    logger.warn('Warning:', warning);
});

initialize();