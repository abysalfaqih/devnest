import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class CommandHandler {
    constructor(client) {
        this.client = client;
        this.commandsPath = join(__dirname, '../commands');
        this.loadedCommands = new Map();
        this.categories = new Map();
    }

    async loadCommands() {
        try {
            await this.loadCommandsFromDirectory(this.commandsPath);
            
            const totalCommands = this.client.commands.size;
            const totalCategories = this.categories.size;
            
            logger.success(`✓ ${totalCommands} commands loaded`);
            
            return true;
        } catch (error) {
            logger.error('Failed to load commands:', error);
            return false;
        }
    }

    async loadCommandsFromDirectory(dir, category = 'General') {
        const items = readdirSync(dir);

        for (const item of items) {
            const itemPath = join(dir, item);
            const stat = statSync(itemPath);

            if (stat.isDirectory()) {
                const subCategory = this.formatCategoryName(item);
                await this.loadCommandsFromDirectory(itemPath, subCategory);
                continue;
            }

            if (!item.endsWith('.js')) {
                continue;
            }

            await this.loadCommand(itemPath, category);
        }
    }

    async loadCommand(filePath, category) {
        try {
            const timestamp = Date.now();
            const command = await import(`file://${filePath}?t=${timestamp}`);

            if (!this.validateCommand(command.default, filePath)) {
                return false;
            }

            const cmd = command.default;
            const commandName = cmd.data.name;

            cmd.category = category;

            this.client.commands.set(commandName, cmd);
            this.loadedCommands.set(commandName, {
                path: filePath,
                category,
                loaded: new Date()
            });

            if (!this.categories.has(category)) {
                this.categories.set(category, []);
            }
            this.categories.get(category).push(commandName);

            return true;

        } catch (error) {
            logger.error(`Failed to load ${filePath.split('/').pop()}:`, error.message);
            return false;
        }
    }

    validateCommand(command, filePath) {
        if (!command) {
            logger.warn(`⚠️ ${filePath.split('/').pop()}: undefined`);
            return false;
        }

        if (!command.data) {
            logger.warn(`⚠️ ${filePath.split('/').pop()}: missing 'data'`);
            return false;
        }

        if (!command.execute || typeof command.execute !== 'function') {
            logger.warn(`⚠️ ${filePath.split('/').pop()}: missing 'execute'`);
            return false;
        }

        if (!command.data.name) {
            logger.warn(`⚠️ ${filePath.split('/').pop()}: missing name`);
            return false;
        }

        return true;
    }

    async reloadCommand(commandName) {
        try {
            const commandInfo = this.loadedCommands.get(commandName);
            if (!commandInfo) {
                logger.warn(`Command ${commandName} not found`);
                return false;
            }

            this.client.commands.delete(commandName);
            
            const category = commandInfo.category;
            const categoryCommands = this.categories.get(category);
            if (categoryCommands) {
                const index = categoryCommands.indexOf(commandName);
                if (index > -1) categoryCommands.splice(index, 1);
            }

            await this.loadCommand(commandInfo.path, category);
            
            logger.success(`✓ Reloaded: ${commandName}`);
            return true;

        } catch (error) {
            logger.error(`Failed to reload ${commandName}:`, error);
            return false;
        }
    }

    async reloadAllCommands() {
        this.client.commands.clear();
        this.loadedCommands.clear();
        this.categories.clear();

        return await this.loadCommands();
    }

    getCommandsByCategory(category) {
        return this.categories.get(category) || [];
    }

    getCategories() {
        return Array.from(this.categories.keys());
    }

    formatCategoryName(name) {
        return name
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    getStats() {
        return {
            totalCommands: this.client.commands.size,
            totalCategories: this.categories.size,
            categories: Object.fromEntries(
                Array.from(this.categories.entries()).map(([cat, cmds]) => [cat, cmds.length])
            ),
            commands: Array.from(this.loadedCommands.entries()).map(([name, info]) => ({
                name,
                category: info.category,
                loaded: info.loaded
            }))
        };
    }
}

export async function loadCommands(client) {
    const handler = new CommandHandler(client);
    return await handler.loadCommands();
}