import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Cropper, { Area } from 'react-easy-crop';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  userName: string;
  size?: 'sm' | 'md' | 'lg';
  accentHex: string;
  onUploadComplete: (url: string) => void;
  editable?: boolean;
}

const SIZES = {
  sm: { container: 'w-16 h-16', text: 'text-xl', icon: 'w-4 h-4' },
  md: { container: 'w-24 h-24', text: 'text-4xl', icon: 'w-6 h-6' },
  lg: { container: 'w-32 h-32', text: 'text-5xl', icon: 'w-8 h-8' }
};

// Helper: Load image from URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
}

// Helper: Extract cropped region as blob
async function getCroppedImage(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Output size: 400x400 is good quality for avatars at any display size
  const outputSize = 400;
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Draw the cropped region scaled to output size
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  // Convert to blob (JPEG at 90% quality for good compression)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas toBlob failed'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatarUrl,
  userName,
  size = 'md',
  accentHex,
  onUploadComplete,
  editable = true
}) => {
  const { t } = useTranslation();
  // Display state
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const sizeConfig = SIZES[size];

  // Handle crop completion (called continuously while dragging)
  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Handle file selection - opens crop modal
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError(t('avatar.errors.invalidType'));
      return;
    }

    // Validate file size (5MB max - will be compressed after crop)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('avatar.errors.tooLarge'));
      return;
    }

    setError(null);

    // Read file and open crop modal
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setImageToCrop(dataUrl);
        // Reset crop state for new image
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
      }
    };
    reader.onerror = () => {
      setError(t('avatar.errors.readFailed'));
    };
    reader.readAsDataURL(file);

    // Reset file input so same file can be selected again
    event.target.value = '';
  };

  // Cancel crop - close modal without uploading
  const handleCancelCrop = () => {
    setImageToCrop(null);
    setCroppedAreaPixels(null);
  };

  // Save crop - upload the cropped image
  const handleSaveCrop = async () => {
    if (!imageToCrop || !croppedAreaPixels) {
      setError(t('avatar.errors.cropRequired'));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Get the cropped image as a blob
      const croppedBlob = await getCroppedImage(imageToCrop, croppedAreaPixels);

      // Close crop modal
      setImageToCrop(null);

      // Upload to Supabase Storage
      const fileName = `${userId}/avatar`;

      // Delete any existing avatar first (ignore errors - might not exist)
      await supabase.storage.from('avatars').remove([fileName]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add timestamp to bust cache
      const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithTimestamp })
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      onUploadComplete(urlWithTimestamp);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setError(err.message || t('avatar.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  // Click avatar to open file picker
  const handleClick = () => {
    if (editable && !uploading && !imageToCrop) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        <button
          onClick={handleClick}
          disabled={!editable || uploading}
          className={`
            ${sizeConfig.container} rounded-full flex items-center justify-center
            font-black mx-auto border-4 border-[var(--bg-card)] shadow-sm
            ${editable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
            transition-opacity relative overflow-hidden group
          `}
          style={{ backgroundColor: `${accentHex}20`, color: accentHex }}
          type="button"
        >
          {currentAvatarUrl ? (
            <img
              src={currentAvatarUrl}
              alt={userName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className={sizeConfig.text}>
              {(userName?.[0] || '?').toUpperCase()}
            </span>
          )}

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
              <div className="animate-spin">
                <ICONS.RefreshCw className={`${sizeConfig.icon} text-white`} />
              </div>
            </div>
          )}

          {/* Edit overlay on hover */}
          {editable && !uploading && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center rounded-full transition-colors">
              <ICONS.Camera className={`${sizeConfig.icon} text-white opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          )}
        </button>

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-scale-caption text-center mt-2 max-w-[200px] mx-auto">
            {error}
          </p>
        )}

        {/* Helper text */}
        {editable && !error && (
          <p className="text-[var(--text-secondary)] text-scale-caption text-center mt-2">
            {uploading ? t('avatar.uploading') : currentAvatarUrl ? t('avatar.clickToChange') : t('avatar.clickToUpload')}
          </p>
        )}
      </div>

      {/* Crop Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50">
            <h2 className="text-white font-bold text-scale-heading">{t('avatar.adjustPhoto')}</h2>
            <button
              onClick={handleCancelCrop}
              className="text-white/70 hover:text-white p-2"
              type="button"
            >
              <ICONS.X className="w-6 h-6" />
            </button>
          </div>

          {/* Crop area - takes most of the screen */}
          <div className="relative flex-1 min-h-0">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          {/* Controls */}
          <div className="p-4 sm:p-6 bg-[var(--bg-card)] space-y-4">
            {/* Zoom slider */}
            <div className="flex items-center gap-3 max-w-md mx-auto">
              <button
                onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                className="p-2 rounded-full hover:bg-[var(--bg-primary)] transition-colors"
                type="button"
              >
                <ICONS.Minus className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer accent-current"
                style={{ accentColor: accentHex }}
              />
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                className="p-2 rounded-full hover:bg-[var(--bg-primary)] transition-colors"
                type="button"
              >
                <ICONS.Plus className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 max-w-md mx-auto">
              <button
                onClick={handleCancelCrop}
                disabled={uploading}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-primary)] transition-colors disabled:opacity-50"
                type="button"
              >
                {t('avatar.cancel')}
              </button>
              <button
                onClick={handleSaveCrop}
                disabled={uploading || !croppedAreaPixels}
                className="flex-1 py-3 px-6 rounded-xl text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: accentHex }}
                type="button"
              >
                {uploading ? (
                  <>
                    <ICONS.RefreshCw className="w-4 h-4 animate-spin" />
                    {t('avatar.saving')}
                  </>
                ) : (
                  t('avatar.save')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarUpload;
