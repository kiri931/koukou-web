export interface PdfFile {
  id: string;
  file: File;
  name: string;
  pageCount: number;
  previewUrl: string | null;
  previewPage: number;
}
