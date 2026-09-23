import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Uploads a base64 Data URL or File image to Supabase Storage bucket `complaint-images`.
 * Returns the public URL of the uploaded image.
 */
export async function uploadComplaintImage(
  base64OrDataUrl: string,
  referenceNumber: string,
  index: number = 0
): Promise<string> {
  if (!isSupabaseConfigured() || !base64OrDataUrl.startsWith('data:image')) {
    return base64OrDataUrl;
  }

  try {
    // 1. Extract MimeType and Base64 Payload
    const matches = base64OrDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (!matches || matches.length < 3) return base64OrDataUrl;

    const mimeType = matches[1];
    const base64Data = matches[2];
    const extension = mimeType.split('/')[1] || 'jpg';

    // 2. Decode Base64 string to Uint8Array
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // 3. Define Storage Path inside bucket `complaint-images`
    const fileName = `img_${Date.now()}_${index}.${extension}`;
    const filePath = `${referenceNumber}/${fileName}`;

    // 4. Upload to Supabase Storage
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('complaint-images')
      .upload(filePath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.warn('Supabase storage upload notice:', uploadErr);
      return base64OrDataUrl;
    }

    // 5. Get Public Access URL
    const { data: publicUrlData } = supabase.storage
      .from('complaint-images')
      .getPublicUrl(uploadData.path);

    const publicUrl = publicUrlData.publicUrl;

    // 6. Record metadata in public.complaint_images table if complaint exists
    try {
      const { data: cmp } = await supabase
        .from('complaints')
        .select('id')
        .eq('reference_number', referenceNumber)
        .maybeSingle();

      if (cmp?.id) {
        await supabase.from('complaint_images').insert({
          complaint_id: cmp.id,
          storage_path: uploadData.path,
          file_name: fileName,
          mime_type: mimeType,
        });
      }
    } catch (_) {}

    return publicUrl;
  } catch (err) {
    console.warn('Storage upload error fallback:', err);
    return base64OrDataUrl;
  }
}

/**
 * Uploads an array of image evidence (Base64 data URLs) for a complaint reference.
 */
export async function uploadAllComplaintImages(
  evidenceFiles: string[],
  referenceNumber: string
): Promise<string[]> {
  if (!evidenceFiles || evidenceFiles.length === 0) return [];
  const uploadedUrls = await Promise.all(
    evidenceFiles.map((file, idx) => uploadComplaintImage(file, referenceNumber, idx))
  );
  return uploadedUrls;
}
