import { ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

export type UploadedDocument = {
  originalName: string;
  safeName: string;
  storagePath: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number; total: number }
  | { status: "done"; documents: UploadedDocument[] }
  | { status: "error"; message: string };

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors storage.rules
const MAX_FILES = 8;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

export function validateFiles(files: FileList | File[]): string | null {
  const list = Array.from(files);

  if (list.length > MAX_FILES) {
    return `Максимум ${MAX_FILES} файлів.`;
  }

  for (const file of list) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `Файл «${file.name}» перевищує 10 МБ.`;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Файл «${file.name}» має непідтримуваний формат. Дозволено: JPG, PNG, WEBP, HEIC, PDF.`;
    }
  }

  return null;
}

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w.\-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 100);
}

export async function uploadLeadDocuments(
  files: File[],
  leadId: string,
  onProgress?: (done: number, total: number) => void
): Promise<UploadedDocument[]> {
  const results: UploadedDocument[] = [];
  const ts = Date.now();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const safeName = `${ts}-${i}-${sanitizeFileName(file.name)}`;
    const storagePath = `lead-documents/${leadId}/${safeName}`;
    const storageRef = ref(storage, storagePath);

    await new Promise<void>((resolve, reject) => {
      const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

      task.on(
        "state_changed",
        () => onProgress?.(i, files.length),
        (error) => reject(error),
        () => resolve()
      );
    });

    results.push({
      originalName: file.name,
      safeName,
      storagePath,
      contentType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString()
    });

    onProgress?.(i + 1, files.length);
  }

  return results;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );
}
