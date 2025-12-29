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
        
        // Ticket Errors
        TICKET_CREATION_FAILED: 'Gagal membuat ticket!',
        TICKET_CHANNEL_NOT_FOUND: 'Channel ticket tidak ditemukan!',
        TICKET_CATEGORY_NOT_FOUND: 'Category ticket tidak ditemukan!',
        TICKET_ALREADY_EXISTS: 'Anda sudah memiliki ticket yang aktif!',

        // Protected Link Errors
        LINK_NOT_FOUND: 'Protected link tidak ditemukan!',
        LINK_CREATION_FAILED: 'Gagal membuat protected link!',
        LINK_UPDATE_FAILED: 'Gagal mengupdate protected link!',
        LINK_DELETE_FAILED: 'Gagal menghapus protected link!',
        INVALID_PASSWORD: '❌ Password salah! Silakan coba lagi.',
        MESSAGE_NOT_FOUND: 'Message tidak ditemukan di channel!',
        INVALID_IMAGE_URL: 'URL gambar tidak valid! Pastikan dimulai dengan http:// atau https://',
    },

    SUCCESS: {
        VERIFICATION_COMPLETE: (roleName) => `Berhasil diverifikasi sebagai ${roleName}!`,
        ALREADY_VERIFIED: 'Anda sudah terverifikasi!',
        SETUP_COMPLETE: (channel) => `Embed verifikasi berhasil dikirim ke ${channel}!`,
        
        // Ticket Success
        PANEL_TICKET_SETUP: (channel) => `Panel ticket berhasil dikirim ke ${channel}!`,
        TICKET_CREATED: (channel) => `Ticket berhasil dibuat! ${channel}`,

        // Protected Link Success
        LINK_CREATED: (channel) => `✅ Protected link berhasil dibuat di ${channel}!`,
        LINK_UPDATED: '✅ Protected link berhasil diupdate!',
        LINK_DELETED: '✅ Protected link berhasil dihapus!',
        PASSWORD_CORRECT: '✅ Password benar! Berikut adalah konten rahasia:',
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

    TICKET: {
        PANEL_TITLE: 'Devnest Support',
        PANEL_DESCRIPTION: 'Gunakan ticket untuk melakukan pemesanan (Order). Ticket yang dibuat di luar kategori tersebut tidak akan diproses dan akan ditutup secara otomatis sesuai dengan kebijakan yang berlaku.',
        BUTTON_LABEL: 'Order Product',
        
        MODAL_TITLE: 'Buat Ticket Baru',
        MODAL_LABEL: 'Kategori apa yang dipilih?',
        MODAL_PLACEHOLDER: 'Jasa atau Product?',
        
        WELCOME_TITLE: 'Ticket Dibuat',
        WELCOME_DESCRIPTION: (user, category) => `${user} Terima kasih telah membuat ticket!\n\n**Kategori:** ${category}\n\nStaff kami akan segera membantu Anda. Mohon tunggu sebentar.`,
    },

    SENDMSG: {
        MODAL_TITLE: 'Kirim Pesan',
        MODAL_TITLE_LABEL: 'Judul (Untuk Embed)',
        MODAL_TITLE_PLACEHOLDER: 'Masukkan judul',
        MODAL_MESSAGE_LABEL: 'Pesan',
        MODAL_MESSAGE_PLACEHOLDER: 'Masukkan pesan Anda',
        MODAL_COLOR_LABEL: 'Warna Embed (Hex)',
        MODAL_COLOR_PLACEHOLDER: '#00FF00 atau 00FF00',
        MODAL_IMAGE_LABEL: 'Link Gambar (Opsional)',
        MODAL_IMAGE_PLACEHOLDER: 'https://example.com/image.png',
        
        SUCCESS: (channel) => `Pesan berhasil dikirim ke ${channel}!`,
        ERROR_SEND: 'Gagal mengirim pesan!',
        ERROR_INVALID_COLOR: 'Format warna tidak valid! Gunakan format hex (contoh: #00FF00)',
        ERROR_INVALID_IMAGE_URL: 'URL gambar tidak valid! Pastikan dimulai dengan http:// atau https://',
        ERROR_NO_PERMISSION: 'Bot tidak memiliki permission untuk mengirim pesan di channel tersebut!',
    },

    PROTECTED_LINK: {
        MODAL_PASSWORD_TITLE: 'Masukkan Password',
        MODAL_PASSWORD_LABEL: 'Password',
        MODAL_PASSWORD_PLACEHOLDER: 'Masukkan Password Konten',
        
        MODAL_SECRET_TITLE: 'Pesan Rahasia',
        MODAL_SECRET_LABEL: 'Konten Rahasia',
        MODAL_SECRET_PLACEHOLDER: 'Masukkan konten utamanya!',

        SECRET_EMBED_TITLE: 'Access Granted',
        SECRET_EMBED_DESCRIPTION: (title) => `**${title}**`,
        SECRET_EMBED_FOOTER: '© Devnest',
    },

    LOGGER: {
        VERIFICATION_SUCCESS: (userTag) => `${userTag} telah diverifikasi`,
        SETUP_SUCCESS: (channelName, userTag) => `Embed verifikasi berhasil dikirim ke #${channelName} oleh ${userTag}`,
        DEVELOPER_ACCESS: (userTag, commandName) => `Developer ${userTag} mengakses command ${commandName}`,
        ADMIN_ACCESS: (userTag, commandName) => `Admin ${userTag} mengakses command ${commandName}`,
        
        // Ticket Logs
        TICKET_CREATED: (userTag, channelName, category) => `Ticket dibuat oleh ${userTag} (#${channelName}) - Kategori: ${category}`,
        PANEL_TICKET_SETUP: (channelName, userTag) => `Panel ticket dikirim ke #${channelName} oleh ${userTag}`,
        
        // Send Message Logs
        MESSAGE_SENT: (userTag, channelName, isEmbed) => `Pesan ${isEmbed ? 'embed' : 'biasa'} dikirim ke #${channelName} oleh ${userTag}`,

        // Protected Link Logs
        LINK_CREATED: (userTag, channelName, title) => `Protected link "${title}" dibuat di #${channelName} oleh ${userTag}`,
        LINK_UPDATED: (userTag, messageId) => `Protected link ${messageId} diupdate oleh ${userTag}`,
        LINK_DELETED: (userTag, messageId) => `Protected link ${messageId} dihapus oleh ${userTag}`,
        LINK_ACCESSED: (userTag, title) => `${userTag} berhasil mengakses protected link "${title}"`,
        LINK_ACCESS_FAILED: (userTag, title) => `${userTag} gagal mengakses protected link "${title}" (password salah)`,
    }
};

export default MESSAGES;