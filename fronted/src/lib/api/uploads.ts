import { api } from "@/lib/axios";

export interface UploadImageResponse {
  url: string;
  filename: string;
}

export async function uploadImage(file: Blob | File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<UploadImageResponse>("/uploads/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.url;
}
