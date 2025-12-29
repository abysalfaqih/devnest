import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class LinkManager {
    constructor() {
        this.dataPath = join(__dirname, '../data');
        this.filePath = join(this.dataPath, 'protectedLinks.json');
        this.links = new Map();
        this.saltRounds = 10;
        
        this.ensureDataDirectory();
        this.loadLinks();
    }

    ensureDataDirectory() {
        if (!existsSync(this.dataPath)) {
            mkdirSync(this.dataPath, { recursive: true });
            logger.info('Created data directory');
        }
    }

    loadLinks() {
        try {
            if (existsSync(this.filePath)) {
                const data = readFileSync(this.filePath, 'utf8');
                const parsed = JSON.parse(data);
                
                Object.entries(parsed).forEach(([key, value]) => {
                    this.links.set(key, value);
                });
                
                logger.success(`✓ Loaded ${this.links.size} protected links`);
            } else {
                this.saveLinks();
                logger.info('Created new protectedLinks.json');
            }
        } catch (error) {
            logger.error('Error loading protected links:', error);
            this.links = new Map();
        }
    }

    saveLinks() {
        try {
            const obj = Object.fromEntries(this.links);
            writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf8');
            return true;
        } catch (error) {
            logger.error('Error saving protected links:', error);
            return false;
        }
    }

    async hashPassword(password) {
        return await bcrypt.hash(password, this.saltRounds);
    }

    async verifyPassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    async createLink(data) {
        try {
            const {
                messageId,
                guildId,
                channelId,
                embedTitle,
                embedDescription,
                embedImage,
                buttonLabel,
                password,
                secretMessage,
                createdBy
            } = data;

            const hashedPassword = await this.hashPassword(password);

            const linkData = {
                messageId,
                guildId,
                channelId,
                embedTitle,
                embedDescription,
                embedImage: embedImage || null,
                buttonLabel,
                password: hashedPassword,
                secretMessage,
                createdBy,
                createdAt: Date.now(),
                lastModified: Date.now(),
                accessCount: 0
            };

            this.links.set(messageId, linkData);
            this.saveLinks();

            logger.success(`Protected link created: ${messageId}`);
            return { success: true, data: linkData };

        } catch (error) {
            logger.error('Error creating link:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLink(messageId, updates) {
        try {
            const existing = this.links.get(messageId);
            if (!existing) {
                return { success: false, error: 'Link not found' };
            }

            if (updates.password) {
                updates.password = await this.hashPassword(updates.password);
            }

            const updated = {
                ...existing,
                ...updates,
                lastModified: Date.now()
            };

            this.links.set(messageId, updated);
            this.saveLinks();

            logger.success(`Protected link updated: ${messageId}`);
            return { success: true, data: updated };

        } catch (error) {
            logger.error('Error updating link:', error);
            return { success: false, error: error.message };
        }
    }

    deleteLink(messageId) {
        try {
            if (!this.links.has(messageId)) {
                return { success: false, error: 'Link not found' };
            }

            this.links.delete(messageId);
            this.saveLinks();

            logger.success(`Protected link deleted: ${messageId}`);
            return { success: true };

        } catch (error) {
            logger.error('Error deleting link:', error);
            return { success: false, error: error.message };
        }
    }

    getLink(messageId) {
        return this.links.get(messageId) || null;
    }

    getLinksByUser(userId) {
        const userLinks = [];
        for (const [id, link] of this.links.entries()) {
            if (link.createdBy === userId) {
                userLinks.push({ id, ...link });
            }
        }
        return userLinks;
    }

    getLinksByGuild(guildId) {
        const guildLinks = [];
        for (const [id, link] of this.links.entries()) {
            if (link.guildId === guildId) {
                guildLinks.push({ id, ...link });
            }
        }
        return guildLinks;
    }

    async verifyLinkPassword(messageId, password) {
        const link = this.links.get(messageId);
        if (!link) {
            return { success: false, error: 'Link not found' };
        }

        const isValid = await this.verifyPassword(password, link.password);
        
        if (isValid) {
            link.accessCount++;
            this.saveLinks();
            
            return { 
                success: true, 
                secretMessage: link.secretMessage,
                embedTitle: link.embedTitle
            };
        }

        return { success: false, error: 'Invalid password' };
    }

    getAllLinks() {
        return Array.from(this.links.entries()).map(([id, link]) => ({
            id,
            ...link,
            password: '***HIDDEN***'
        }));
    }

    getStats() {
        return {
            totalLinks: this.links.size,
            totalAccess: Array.from(this.links.values()).reduce((sum, link) => sum + link.accessCount, 0)
        };
    }
}

export const linkManager = new LinkManager();
export default linkManager;