import { api } from "@/lib/axios";

export interface UploadImageResponse {
  url: string;
  filename: string;
}

export interface UploadDocumentResponse {
  url: string;
  filename: string;
  mimeType: string;
}

export async function uploadImage(file: Blob | File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadImageResponse>("/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.url;
}

/** Sube un documento (PDF o imagen) para adjuntarlo a un informe. */
export async function uploadDocument(
  file: Blob | File,
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadDocumentResponse>(
    "/uploads/document",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return data;
}
