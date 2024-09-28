const mime = require('mime-types');

const SUPPORTED_MIME_TYPES = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/svg+xml"],
    video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"],  // mp4, webm, ogg, quicktime (.mov), avi
    audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/flac", "audio/webm", "audio/mp3"],  // mp3, wav, ogg, mp4, aac, flac, webm audio
};


/**
 * Determine if a file is an image, video, or audio file based on its extension.
 * @param {string} filePath - The file path or name.
 * @returns {string|null} - The file type ('image', 'video', 'audio') or null if unsupported.
 */
const determineFileCategoryFromExtension = (file) => {
    const mimeType = file.mimetype;

    if (SUPPORTED_MIME_TYPES.image.includes(mimeType)) {
        return "image";
    } else if (SUPPORTED_MIME_TYPES.video.includes(mimeType)) {
        return "video";
    } else if (SUPPORTED_MIME_TYPES.audio.includes(mimeType)) {
        return "audio";
    } else {
        return null;
    }
};

module.exports = determineFileCategoryFromExtension;
