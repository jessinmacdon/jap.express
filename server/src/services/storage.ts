import { randomUUID } from 'node:crypto';
import { env } from '../env.ts';

// Photo and document uploads. The client asks for an upload URL, PUTs the file
// there, then sends the returned public URL with the listing / verification.
// TODO: back this with S3 / Cloudflare R2 presigned URLs. Verification
// documents must go to a private bucket with encryption at rest.
export function createUploadTarget(kind: 'listing_photo' | 'verification' | 'chat_image', contentType: string) {
  const key = `${kind}/${randomUUID()}`;
  return {
    key,
    uploadUrl: `${env.PUBLIC_URL}/uploads/${key}`, // dev: accepted by PUT /uploads/*
    publicUrl: `${env.PUBLIC_URL}/uploads/${key}`,
    contentType,
  };
}
