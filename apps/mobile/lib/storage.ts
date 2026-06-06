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
  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = blob.type && blob.type.length > 0 ? blob.type : "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const storagePath = `conversations/${conversationId}/attachments/${Date.now()}.${ext}`;
  const fileRef = ref(storage, storagePath);
  await uploadBytes(fileRef, blob, { contentType });
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
