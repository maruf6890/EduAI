/**
 * Action: Uploads raw audio recordings or prescription pictures for server-side processing.
 */
export async function uploadClinicalMedia(fileBlob: Blob, fileType: 'audio' | 'document') {
  try {
    const formData = new FormData();
    formData.append('file', fileBlob);
    formData.append('type', fileType);

    const response = await fetch('https://your-backend-api.com/api/v1/media/upload', {
      method: 'POST',
      body: formData, // Browser automatically applies content-type: multipart/form-data headers
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Media pipeline upload failed.');

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}