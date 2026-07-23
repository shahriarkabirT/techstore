import fs from 'fs';
import path from 'path';

/**
 * Deletes an image file from the public directory.
 * @param imageUrl The relative URL of the image (e.g., '/uploads/filename.jpg')
 */
export async function deleteImage(imageUrl: string | undefined | null): Promise<boolean> {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
        return false;
    }

    try {
        const filePath = path.join(process.cwd(), 'public', imageUrl);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Successfully deleted image: ${imageUrl}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error deleting image ${imageUrl}:`, error);
        return false;
    }
}

/**
 * Deletes multiple images.
 * @param imageUrls Array of relative image URLs
 */
export async function deleteImages(imageUrls: (string | undefined | null)[]): Promise<void> {
    if (!imageUrls || !Array.isArray(imageUrls)) return;

    await Promise.all(imageUrls.map(url => deleteImage(url)));
}
