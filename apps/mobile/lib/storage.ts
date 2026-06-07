// ─── Firebase Storage uploads ─────────────────────────────────────────────────
// student-documents/{uid}/... — Storage rules allow the owner (and staff) to write image/pdf ≤10MB.
// conversations/{convId}/attachments/{name} — same storage, public-read after download URL issued.
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "./firebase";

const storage = getStorage(firebaseApp);

export type UploadResult = { storagePath: string; downloadURL: string };

function extFromContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("pdf")) return "pdf";
  if (contentType.includes("wordprocessingml")) return "docx";
  if (contentType.includes("spreadsheetml")) return "xlsx";
  if (contentType.includes("presentationml")) return "pptx";
  if (contentType.includes("msword")) return "doc";
  if (contentType.includes("text/plain")) return "txt";
  return "jpg";
}

function safeFileName(name: string): string {
  const cleaned = name.trim().replace(/[^\w.\-() ]+/g, "_").replace(/\s+/g, "-");
  return cleaned || `file-${Date.now()}`;
}

async function uploadLocalUri(
  uri: string,
  storagePath: string,
  fallbackContentType = "image/jpeg"
): Promise<UploadResult & { fileSize?: number; contentType: string }> {
  let blob: Blob;
  try {
    const response = await fetch(uri);
    blob = await response.blob();
  } catch (fetchErr) {
    console.error("[storage] fetch/blob failed:", fetchErr, "uri:", uri);
    throw new Error(`Не вдалося прочитати файл: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
  }

  const contentType = blob.type && blob.type.length > 0 ? blob.type : fallbackContentType;
  const fileRef = ref(storage, storagePath);

  try {
    await uploadBytes(fileRef, blob, { contentType });
  } catch (uploadErr) {
    console.error("[storage] uploadBytes failed:", uploadErr, "path:", storagePath, "size:", blob.size, "type:", contentType);
    throw new Error(`Не вдалося завантажити файл: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`);
  }

  const downloadURL = await getDownloadURL(fileRef);
  return { storagePath, downloadURL, fileSize: blob.size, contentType };
}

// Upload a chat image to conversations/{convId}/attachments/.
export async function uploadChatImage(
  conversationId: string,
  uri: string
): Promise<UploadResult & { fileSize?: number; contentType: string }> {
  const storagePath = `conversations/${conversationId}/attachments/${Date.now()}.jpg`;
  return uploadLocalUri(uri, storagePath);
}

export async function uploadChatFile(
  conversationId: string,
  uri: string,
  fileName?: string,
  mimeType?: string
): Promise<UploadResult & { fileSize?: number; contentType: string }> {
  const fallbackContentType = mimeType || "application/octet-stream";
  const ext = fileName?.includes(".") ? "" : `.${extFromContentType(fallbackContentType)}`;
  const storagePath = `conversations/${conversationId}/attachments/${Date.now()}-${safeFileName(fileName ?? "file")}${ext}`;
  return uploadLocalUri(uri, storagePath, fallbackContentType);
}

export async function uploadStoryMedia(
  storyId: string,
  uri: string
): Promise<UploadResult & { fileSize?: number; contentType: string }> {
  const storagePath = `stories/${storyId}/${Date.now()}.jpg`;
  return uploadLocalUri(uri, storagePath);
}

export async function uploadClubImage(
  postId: string,
  uri: string
): Promise<UploadResult & { fileSize?: number; contentType: string }> {
  const storagePath = `clubMedia/${postId}/${Date.now()}.jpg`;
  return uploadLocalUri(uri, storagePath);
}

// Upload a local file URI (from image picker) to the student's documents folder.
export async function uploadStudentDocument(
  uid: string,
  kind: string,
  uri: string
): Promise<UploadResult> {
  let blob: Blob;
  try {
    const response = await fetch(uri);
    blob = await response.blob();
  } catch (fetchErr) {
    throw new Error(`Не вдалося прочитати файл: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
  }
  const contentType = blob.type && blob.type.length > 0 ? blob.type : "image/jpeg";
  const ext = extFromContentType(contentType);
  const storagePath = `student-documents/${uid}/${kind}-${Date.now()}.${ext}`;
  const fileRef = ref(storage, storagePath);
  try {
    await uploadBytes(fileRef, blob, { contentType });
  } catch (uploadErr) {
    throw new Error(`Не вдалося завантажити файл: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`);
  }
  const downloadURL = await getDownloadURL(fileRef);
  return { storagePath, downloadURL };
}
