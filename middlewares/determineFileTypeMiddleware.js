const mime = require('mime-types');

const SUPPORTED_MIME_TYPES = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm", "video/ogg"],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
};

/**
 * Determine if a file is an image, video, or audio file based on its extension.
 * @param {string} filePath - The file path or name.
 * @returns {string|null} - The file type ('image', 'video', 'audio') or null if unsupported.
 */
const determineFileCategoryFromExtension = (filePath) => {
    // Get MIME type from file extension
    const mimeType = mime.lookup(filePath);

    if (mimeType) {
        if (SUPPORTED_MIME_TYPES.image.includes(mimeType)) {
            return "image";
        }
        if (SUPPORTED_MIME_TYPES.video.includes(mimeType)) {
            return "video";
        }
        if (SUPPORTED_MIME_TYPES.audio.includes(mimeType)) {
            return "audio";
        }
    }
    return null; // File type not supported
};

module.exports = determineFileCategoryFromExtension;
