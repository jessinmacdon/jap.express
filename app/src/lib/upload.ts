import * as ImagePicker from 'expo-image-picker';
import { authHeader, post } from '@/api/client';

type Kind = 'listing_photo' | 'verification' | 'chat_image';

// Pick (or shoot) a photo and upload it; resolves to the public URL, or null if cancelled.
export async function pickAndUpload(kind: Kind, opts: { camera?: boolean } = {}): Promise<string | null> {
  const perm = opts.camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('permission_denied');
  const res = opts.camera
    ? await ImagePicker.launchCameraAsync({ quality: 0.7, cameraType: ImagePicker.CameraType.front })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets[0]) return null;
  return uploadUri(kind, res.assets[0].uri, res.assets[0].mimeType ?? 'image/jpeg');
}

export async function uploadUri(kind: Kind, uri: string, contentType: string) {
  const target = await post<{ uploadUrl: string; publicUrl: string }>('/uploads/presign', { kind, contentType });
  const blob = await (await fetch(uri)).blob();
  const put = await fetch(target.uploadUrl, { method: 'PUT', headers: { 'content-type': contentType, ...authHeader() }, body: blob });
  if (!put.ok) throw new Error('upload_failed');
  return target.publicUrl;
}
