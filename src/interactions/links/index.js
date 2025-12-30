import {
    handleAccessLinkButton,
    handleShowSecretModal,
    handleShowEditSecretModal,
    handleConfirmDelete,
    handleCancelDelete
} from './buttons.js';

import {
    handleSendlinkModalStep1,
    handleSendlinkModalStep2,
    handlePasswordCheck,
    handleEditlinkModal,
    handleEditlinkSecretModal
} from './modals.js';

/**
 * Export semua link handlers
 */
export const linkHandlers = {
    // Button handlers
    handleAccessLinkButton,
    handleShowSecretModal,
    handleShowEditSecretModal,
    handleConfirmDelete,
    handleCancelDelete,
    
    // Modal handlers
    handleSendlinkModalStep1,
    handleSendlinkModalStep2,
    handlePasswordCheck,
    handleEditlinkModal,
    handleEditlinkSecretModal
};

export default linkHandlers;