
import { GoogleGenAI, Modality } from "@google/genai";

// Always use the API key directly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simple IndexedDB helper for storing large icon strings
const ICON_DB_NAME = 'DisneyIconDB';
const ICON_STORE_NAME = 'icons';

const getDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ICON_DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(ICON_STORE_NAME)) {
        request.result.createObjectStore(ICON_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export async function getCachedIcon(key: string): Promise<string | null> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ICON_STORE_NAME, 'readonly');
      const store = transaction.objectStore(ICON_STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB read failed, falling back to null", e);
    return null;
  }
}

export async function cacheIcon(key: string, value: string): Promise<void> {
  try {
    const db = await getDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(ICON_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(ICON_STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB write failed", e);
  }
}

export async function generateDisneyImage(word: string): Promise<string | null> {
  try {
    const prompt = `A magical Disney Pixar style 3D animation illustration of a ${word}. Vibrant colors, cinematic lighting, cute and friendly character design, high detail, solid pastel background.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation failed:", error);
    return `https://picsum.photos/seed/${word}/400/400`;
  }
}

export async function generateCharacterIcon(prompt: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Icon generation failed:", error);
    return null;
  }
}

export async function generatePronunciation(word: string): Promise<Uint8Array | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${word}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decode(base64Audio);
    }
    return null;
  } catch (error) {
    console.error("TTS failed:", error);
    return null;
  }
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioBuffer(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}
