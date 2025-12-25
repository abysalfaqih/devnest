/**
 * Constants untuk semua messages yang digunakan di bot
 * Memudahkan maintenance dan konsistensi wording
 */

export const MESSAGES = {
    ERROR: {
        COMMAND_NOT_FOUND: 'Command tidak ditemukan',
        COMMAND_EXECUTION: 'Error saat menjalankan command!',
        VERIFICATION_PROCESS: 'Error saat proses verifikasi!',
        SETUP_EMBED: 'Error saat setup embed!',
        ROLE_NOT_FOUND: 'Role verifikasi tidak ditemukan!',
        CHANNEL_NOT_FOUND: 'Channel verifikasi tidak ditemukan!',
        BOT_NO_PERMISSION: 'Bot tidak memiliki permission!',
        BOT_ROLE_POSITION: 'Role bot harus lebih tinggi!',
    },

    SUCCESS: {
        VERIFICATION_COMPLETE: (roleName) => `Berhasil diverifikasi sebagai ${roleName}!`,
        ALREADY_VERIFIED: 'Anda sudah terverifikasi!',
        SETUP_COMPLETE: (channel) => `Embed verifikasi berhasil dikirim ke ${channel}!`,
    },

    PERMISSION: {
        DEVELOPER_ONLY: 'Command hanya bisa digunakan oleh developer!',
        ADMIN_ONLY: 'Command khusus admin atau developer!',
    },

    VERIFICATION: {
        TITLE: 'Devnest',
        DESCRIPTION: 
            'Klik tombol **verifikasi** dibawah untuk mengakses seluruh channel!',
        BUTTON_LABEL: 'Verifikasi',
    },

    LOGGER: {
        VERIFICATION_SUCCESS: (userTag) => `${userTag} telah diverifikasi`,
        SETUP_SUCCESS: (channelName, userTag) => `Embed verifikasi berhasil dikirim ke #${channelName} oleh ${userTag}`,
        DEVELOPER_ACCESS: (userTag, commandName) => `Developer ${userTag} mengakses command ${commandName}`,
        ADMIN_ACCESS: (userTag, commandName) => `Admin ${userTag} mengakses command ${commandName}`,
    }
};

export default MESSAGES;