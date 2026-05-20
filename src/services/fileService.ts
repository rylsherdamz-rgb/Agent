import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { v4 as uuid } from 'uuid';
import type { Attachment } from '../types';

const ATTACHMENTS_DIR = `${FileSystem.documentDirectory}attachments/`;
const THUMBNAILS_DIR = `${FileSystem.documentDirectory}thumbnails/`;

async function ensureDir(dir: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
}

export async function initFileService(): Promise<void> {
  await ensureDir(ATTACHMENTS_DIR);
  await ensureDir(THUMBNAILS_DIR);
}

export async function pickImage(options?: {
  allowsMultiple?: boolean;
  quality?: number;
}): Promise<Attachment[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: options?.allowsMultiple || false,
    quality: options?.quality || 0.8,
  });

  if (result.canceled || !result.assets) return [];

  const attachments: Attachment[] = [];

  for (const asset of result.assets) {
    const id = uuid();
    const ext = asset.uri.split('.').pop() || 'jpg';
    const destPath = `${ATTACHMENTS_DIR}${id}.${ext}`;

    await FileSystem.copyAsync({
      from: asset.uri,
      to: destPath,
    });

    const fileInfo = await FileSystem.getInfoAsync(destPath);
    const size = fileInfo.exists ? fileInfo.size ?? 0 : 0;

    attachments.push({
      id,
      name: asset.fileName || `image_${id}.${ext}`,
      uri: destPath,
      mimeType: asset.mimeType || 'image/jpeg',
      size,
      type: 'image',
      thumbnailUri: asset.uri,
    });
  }

  return attachments;
}

export async function takePhoto(): Promise<Attachment | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const id = uuid();
  const ext = 'jpg';
  const destPath = `${ATTACHMENTS_DIR}${id}.${ext}`;

  await FileSystem.copyAsync({
    from: asset.uri,
    to: destPath,
  });

  const fileInfo = await FileSystem.getInfoAsync(destPath);

  return {
    id,
    name: `photo_${id}.${ext}`,
    uri: destPath,
    mimeType: 'image/jpeg',
    size: fileInfo.exists ? fileInfo.size ?? 0 : 0,
    type: 'image',
    thumbnailUri: asset.uri,
  };
}

export async function pickDocument(): Promise<Attachment[]> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
    multiple: true,
  });

  if (result.canceled || !result.assets) return [];

  const attachments: Attachment[] = [];

  for (const asset of result.assets) {
    const id = uuid();
    const ext = asset.name.split('.').pop() || '';
    const destPath = `${ATTACHMENTS_DIR}${id}${ext ? '.' + ext : ''}`;

    await FileSystem.copyAsync({
      from: asset.uri,
      to: destPath,
    });

    const fileInfo = await FileSystem.getInfoAsync(destPath);

    const mimeType = asset.mimeType || 'application/octet-stream';
    let type: Attachment['type'] = 'document';
    if (mimeType.startsWith('image/')) type = 'image';
    else if (mimeType.startsWith('audio/')) type = 'audio';
    else if (mimeType.startsWith('video/')) type = 'video';

    attachments.push({
      id,
      name: asset.name,
      uri: destPath,
      mimeType,
      size: fileInfo.exists ? fileInfo.size ?? 0 : 0,
      type,
      thumbnailUri: type === 'image' ? destPath : null,
    });
  }

  return attachments;
}

export async function deleteAttachment(attachment: Attachment): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(attachment.uri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(attachment.uri, { idempotent: true });
    }
    if (attachment.thumbnailUri) {
      const thumbInfo = await FileSystem.getInfoAsync(attachment.thumbnailUri);
      if (thumbInfo.exists) {
        await FileSystem.deleteAsync(attachment.thumbnailUri, { idempotent: true });
      }
    }
  } catch {}
}

export async function getFileSize(uri: string): Promise<number> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? info.size ?? 0 : 0;
  } catch {
    return 0;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function getMimeTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'music-note';
  if (mimeType.startsWith('video/')) return 'videocam';
  if (mimeType.includes('pdf')) return 'picture-as-pdf';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  if (mimeType.includes('text') || mimeType.includes('document')) return 'article';
  return 'insert-drive-file';
}