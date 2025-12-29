import config from '../config/config.js';
import MESSAGES from '../constants/messages.js';

export function isDeveloper(userId) {
    return userId === config.developerId;
}

export function isAdmin(member) {
    return member.roles.cache.has(config.adminRoleId);
}

export function checkPermissions(interaction, permissions = {}) {
    const { developer = false, admin = false } = permissions;
    const userId = interaction.user.id;
    const member = interaction.member;

    if (!developer && !admin) {
        return { hasPermission: true };
    }

    if (developer) {
        if (isDeveloper(userId)) {
            return { hasPermission: true };
        }
        return { 
            hasPermission: false, 
            message: MESSAGES.PERMISSION.DEVELOPER_ONLY
        };
    }

    if (admin) {
        if (isDeveloper(userId) || isAdmin(member)) {
            return { hasPermission: true };
        }
        
        return { 
            hasPermission: false, 
            message: MESSAGES.PERMISSION.ADMIN_ONLY
        };
    }

    return { hasPermission: true };
}