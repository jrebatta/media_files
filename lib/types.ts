export interface MediaItem {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  type: 'image' | 'video';
  conversionStatus?: 'pending' | 'converting' | 'completed' | 'failed';
  convertedFileName?: string; // Nombre del archivo MP4 final
  thumbnailFileName?: string; // Nombre del archivo de miniatura (para videos)
}

export interface MediaIndex {
  items: MediaItem[];
}
