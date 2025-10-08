export type ImageUploadResponse = {
  url: string;
  filename: string;
};

export type GenerateImageResponse = {
  imageUrl: string;
  prompt: string;
};

export interface ProjectData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}