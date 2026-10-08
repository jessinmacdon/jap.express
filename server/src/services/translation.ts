import type { Lang } from '../generated/prisma/client.ts';
import { prisma } from '../db.ts';

// Machine translation for chat messages and listing descriptions.
// TODO: implement with DeepL / Google Cloud Translation. Results are cached in
// MessageTranslation / ListingTranslation so each text is translated once.
export interface Translator {
  translate(text: string, from: Lang, to: Lang): Promise<string | null>;
}

class NoopTranslator implements Translator {
  async translate() {
    return null; // unknown → the client shows the original text
  }
}

export const translator: Translator = new NoopTranslator();

export async function translateMessage(messageId: string, text: string, from: Lang, to: Lang) {
  if (from === to) return text;
  const cached = await prisma.messageTranslation.findUnique({ where: { messageId_lang: { messageId, lang: to } } });
  if (cached) return cached.text;
  const out = await translator.translate(text, from, to);
  if (out) await prisma.messageTranslation.create({ data: { messageId, lang: to, text: out } });
  return out;
}

export async function translateListing(key: string, text: string, from: Lang, to: Lang) {
  if (from === to) return text;
  const cached = await prisma.listingTranslation.findUnique({ where: { listingKey_lang: { listingKey: key, lang: to } } });
  if (cached) return cached.text;
  const out = await translator.translate(text, from, to);
  if (out) await prisma.listingTranslation.create({ data: { listingKey: key, lang: to, text: out } });
  return out;
}
