import { useState } from 'react';
import { Package } from 'lucide-react';
import { getImageUrl } from '../utils/getImageUrl';

interface ProductImageProps {
  imageUrl?: string | null;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export default function ProductImage({ 
  imageUrl, 
  alt, 
  className = '', 
  size = 'sm' 
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  
  // Debug logging
  console.log('ProductImage - Raw imageUrl:', imageUrl);
  console.log('ProductImage - Type of imageUrl:', typeof imageUrl);
  
  // Get processed URL from utility
  const processedUrl = getImageUrl(imageUrl);
  console.log('ProductImage - Processed URL:', processedUrl);
  
  // Handle mixed content by forcing HTTPS when possible
  const secureUrl = processedUrl.startsWith('http://') 
    ? processedUrl.replace('http://', 'https://')
    : processedUrl;
  
  console.log('Rendering Image URL:', secureUrl);

  // Size classes for consistent styling with explicit dimensions
  const sizeClasses = {
    sm: 'w-14 h-14 min-w-[56px] min-h-[56px]',
    md: 'w-20 h-20 min-w-[80px] min-h-[80px]', 
    lg: 'w-32 h-32 min-w-[128px] min-h-[128px]',
    full: 'w-full h-48 min-h-[192px]'
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // If no image or error occurred, show placeholder
  if (!processedUrl || imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0`}>
        <Package className="w-1/2 h-1/2 text-blue-400" />
      </div>
    );
  }

  console.log('ProductImage - About to render img with dimensions:', sizeClasses[size]);
  
  return (
    <img
      src={secureUrl}
      alt={alt}
      className={`${sizeClasses[size]} ${className} rounded-lg object-cover bg-gray-100 shrink-0 block`}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={handleImageError}
      onLoad={() => console.log('ProductImage - Image loaded successfully:', secureUrl)}
      style={{ display: 'block', visibility: 'visible' }}
    />
  );
}
