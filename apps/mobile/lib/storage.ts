// ─── Firebase Storage uploads ─────────────────────────────────────────────────
// student-documents/{uid}/... — Storage rules allow the owner (and staff) to write image/pdf ≤10MB.
// conversations/{convId}/attachments/{name} — same storage, public-read after download URL issued.
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "./firebase";

const storage = getStorage(firebaseApp);

export type UploadResult = { storagePath: string; downloadURL: string };

// Upload a chat image to conversations/{convId}/attachments/.
export async function uploadChatImage(
  conversationId: string,
  uri: string
): Promise<UploadResult> {
  // On Android, content:// URIs need special handling.
  // fetch() on a content:// URI works in Expo/React Native.
  let blob: Blob;
  try {
    const response = await fetch(uri);
    blob = await response.blob();
  } catch (fetchErr) {
    console.error("[uploadChatImage] fetch/blob failed:", fetchErr, "uri:", uri);
    throw new Error(`Не вдалося прочитати файл: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`);
  }

  const contentType = blob.type && blob.type.length > 0 ? blob.type : "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const storagePath = `conversations/${conversationId}/attachments/${Date.now()}.${ext}`;
  const fileRef = ref(storage, storagePath);

  try {
    await uploadBytes(fileRef, blob, { contentType });
  } catch (uploadErr) {
    console.error("[uploadChatImage] uploadBytes failed:", uploadErr, "path:", storagePath, "size:", blob.size, "type:", contentType);
    throw new Error(`Не вдалося завантажити фото: ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`);
  }

  const downloadURL = await getDownloadURL(fileRef);
  return { storagePath, downloadURL };
}

// Upload a local file URI (from image picker) to the student's documents folder.
export async function uploadStudentDocument(
  uid: string,
  kind: string,
  uri: string
): Promise<UploadResult> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = blob.type && blob.type.length > 0 ? blob.type : "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("pdf") ? "pdf" : "jpg";
  const storagePath = `student-documents/${uid}/${kind}-${Date.now()}.${ext}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, blob, { contentType });
  const downloadURL = await getDownloadURL(fileRef);
  return { storagePath, downloadURL };
}
