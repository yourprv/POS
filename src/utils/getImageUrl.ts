export function getImageUrl(input: string | null | undefined): string {
  console.log('getImageUrl - Input:', input, 'Type:', typeof input);
  
  // Ensure we always return a clean string
  if (!input) {
    console.log('getImageUrl - No input, returning empty string');
    return '';
  }
  
  // Convert to string and trim
  const s = String(input).trim();
  console.log('getImageUrl - After string conversion and trim:', s);

  // If it's already an absolute URL, try to normalize Google Drive links
  if (/^https?:\/\//i.test(s)) {
    console.log('getImageUrl - Processing as URL:', s);
    
    // Handle various Google Drive URL formats:
    // 1. /file/d/FILE_ID/view?usp=sharing
    // 2. /d/FILE_ID/view?usp=sharing  
    // 3. ?id=FILE_ID
    // 4. /open?id=FILE_ID
    const fileMatch = s.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/);
    const dMatch = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    const idMatch = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    const openMatch = s.match(/\/open\?id=([a-zA-Z0-9_-]{10,})/);
    
    const fileId = fileMatch?.[1] || dMatch?.[1] || idMatch?.[1] || openMatch?.[1];
    
    if (fileId) {
      const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
      console.log('getImageUrl - Converted to direct URL:', directUrl);
      return directUrl;
    }

    // already a direct driveusercontent link or other image host
    if (s.includes('drive.googleusercontent.com')) {
      console.log('getImageUrl - Already direct usercontent URL:', s);
      return s;
    }

    // otherwise return as-is (works for direct image URLs like Imgur/S3)
    console.log('getImageUrl - Returning as-is (non-Drive URL):', s);
    return s;
  }

  // If it's a bare id (user pasted only the file id), construct a direct view URL
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) {
    const directUrl = `https://drive.google.com/uc?export=view&id=${s}`;
    console.log('getImageUrl - Bare ID converted to URL:', directUrl);
    return directUrl;
  }

  // Fallback: return value unchanged
  console.log('getImageUrl - Fallback, returning as string:', s);
  return s;
}
