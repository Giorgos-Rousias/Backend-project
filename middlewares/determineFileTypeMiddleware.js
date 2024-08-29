    const fileType = require("file-type");

    const SUPPORTED_MIME_TYPES = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/webm", "video/ogg"],
    audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
    };

    /**
     * Determine if a file is an image, video, or audio file.
     * @param {Buffer} buffer - The buffer of the file.
     * @returns {Promise<string|null>} - The file type ('image', 'video', 'audio') or null if unsupported.
     */
    async function determineFileCategory(buffer) {
    try {
        const type = await fileType.fromBuffer(buffer);
        if (type) {
            if (SUPPORTED_MIME_TYPES.image.includes(type.mime)) {
                return "image";
            }
            if (SUPPORTED_MIME_TYPES.video.includes(type.mime)) {
                return "video";
            }
            if (SUPPORTED_MIME_TYPES.audio.includes(type.mime)) {
                return "audio";
            }
        }
        return null; // File type not supported
    } catch (error) {
        console.error("Error determining file type:", error);
        return null;
    }
    }

    module.exports = determineFileCategory;