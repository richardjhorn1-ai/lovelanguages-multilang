import React, { useState, useRef } from 'react';
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

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  userId,
  currentAvatarUrl,
  userName,
  size = 'md',
  accentHex,
  onUploadComplete,
  editable = true
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeConfig = SIZES[size];
  const displayUrl = previewUrl || currentAvatarUrl;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, WebP, or GIF image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);

      // Always use same filename to avoid orphaned files with different extensions
      const fileName = `${userId}/avatar`;

      // Delete any existing avatar first (ignore errors - might not exist)
      await supabase.storage.from('avatars').remove([fileName]);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
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
      setError(err.message || 'Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    if (editable && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
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
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={userName}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className={sizeConfig.text}>
            {userName[0]?.toUpperCase() || '?'}
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
        <p className="text-red-500 text-xs text-center mt-2 max-w-[200px] mx-auto">
          {error}
        </p>
      )}

      {/* Helper text */}
      {editable && !error && (
        <p className="text-[var(--text-secondary)] text-xs text-center mt-2">
          {uploading ? 'Uploading...' : displayUrl ? 'Click to change' : 'Click to upload'}
        </p>
      )}
    </div>
  );
};

export default AvatarUpload;
