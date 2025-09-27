import { createClientComponentClient } from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/lib/supabase';

/**
 * Storage utilities for Supabase Storage
 * Handles file uploads, downloads, and management
 */

export interface UploadOptions {
  cacheControl?: string;
  upsert?: boolean;
  contentType?: string;
}

export interface UploadResult {
  data: { path: string } | null;
  error: Error | null;
}

/**
 * Storage helper class
 */
export class StorageService {
  private supabase = createClientComponentClient();

  /**
   * Upload file to storage bucket
   */
  async uploadFile(
    bucket: keyof typeof STORAGE_BUCKETS,
    path: string,
    file: File,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const bucketName = STORAGE_BUCKETS[bucket];

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(path, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert || false,
          contentType: options?.contentType || file.type,
        });

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Upload error:', error);
        }
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected upload error:', error);
      }
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: keyof typeof STORAGE_BUCKETS, path: string) {
    const bucketName = STORAGE_BUCKETS[bucket];

    const { data } = this.supabase.storage.from(bucketName).getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(
    bucket: keyof typeof STORAGE_BUCKETS,
    path: string
  ): Promise<{ error: Error | null }> {
    try {
      const bucketName = STORAGE_BUCKETS[bucket];

      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Delete error:', error);
        }
        return { error };
      }

      return { error: null };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected delete error:', error);
      }
      return { error: error as Error };
    }
  }

  /**
   * List files in bucket
   */
  async listFiles(
    bucket: keyof typeof STORAGE_BUCKETS,
    path?: string
  ): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const bucketName = STORAGE_BUCKETS[bucket];

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .list(path);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('List files error:', error);
        }
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected list files error:', error);
      }
      return { data: null, error: error as Error };
    }
  }

  /**
   * Download file
   */
  async downloadFile(
    bucket: keyof typeof STORAGE_BUCKETS,
    path: string
  ): Promise<{ data: Blob | null; error: Error | null }> {
    try {
      const bucketName = STORAGE_BUCKETS[bucket];

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .download(path);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Download error:', error);
        }
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected download error:', error);
      }
      return { data: null, error: error as Error };
    }
  }
}

/**
 * Create storage service instance
 */
export const storage = new StorageService();

/**
 * Image upload utilities
 */
export class ImageUploadService {
  private storage = new StorageService();

  /**
   * Upload listing image
   */
  async uploadListingImage(
    listingId: string,
    file: File,
    order: number
  ): Promise<UploadResult> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${listingId}/${order}-${Date.now()}.${fileExtension}`;

    return this.storage.uploadFile('LISTING_IMAGES', fileName, file, {
      contentType: file.type,
      cacheControl: '31536000', // 1 year
    });
  }

  /**
   * Upload profile avatar
   */
  async uploadProfileAvatar(userId: string, file: File): Promise<UploadResult> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExtension}`;

    return this.storage.uploadFile('PROFILE_AVATARS', fileName, file, {
      contentType: file.type,
      cacheControl: '31536000', // 1 year
      upsert: true,
    });
  }

  /**
   * Upload game image
   */
  async uploadGameImage(
    gameId: string,
    file: File,
    type: 'thumbnail' | 'full' = 'full'
  ): Promise<UploadResult> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${gameId}/${type}-${Date.now()}.${fileExtension}`;

    return this.storage.uploadFile('GAME_IMAGES', fileName, file, {
      contentType: file.type,
      cacheControl: '31536000', // 1 year
    });
  }

  /**
   * Validate image file
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File must be a JPEG, PNG, or WebP image' };
    }

    return { valid: true };
  }

  /**
   * Resize image (client-side)
   */
  async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and resize
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          blob => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

/**
 * Create image upload service instance
 */
export const imageUpload = new ImageUploadService();

/**
 * File validation utilities
 */
export const fileValidation = {
  /**
   * Validate file size
   */
  validateSize: (file: File, maxSizeMB: number): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  /**
   * Validate file type
   */
  validateType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  /**
   * Get file size in human readable format
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};
