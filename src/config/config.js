import dotenv from 'dotenv';
dotenv.config();

export default {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,
    verifiedRoleId: process.env.VERIFIED_ROLE_ID,
    verificationChannelId: process.env.VERIFICATION_CHANNEL_ID,
    developerId: process.env.DEVELOPER,
    adminRoleId: process.env.ADMIN,
};