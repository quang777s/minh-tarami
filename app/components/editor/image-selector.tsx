import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  url?: string;
}

interface ImageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaFile[];
  supabaseUrl: string;
  onSelect: (imageUrl: string) => void;
}

export function ImageSelector({
  open,
  onOpenChange,
  media,
  supabaseUrl,
  onSelect,
}: ImageSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [mediaList, setMediaList] = useState<MediaFile[]>(media);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      // Add the new file to the media list
      const newFile: MediaFile = {
        name: file.name,
        id: file.name,
        created_at: new Date().toISOString(),
        url: data.file.url // Use the URL from the response
      };

      setMediaList(prev => [newFile, ...prev]);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getImageUrl = (file: MediaFile) => {
    // If the file has a direct URL (newly uploaded), use it
    if (file.url) {
      return file.url;
    }
    // Otherwise, construct the URL for existing files
    return `${supabaseUrl}/storage/v1/object/public/taramind/${file.name}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="z-[100] bg-white/30 dark:bg-gray-950/30 backdrop-blur-[2px]" />
      <DialogContent className="max-w-4xl z-[101] bg-white dark:bg-gray-950">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">Select Image</DialogTitle>
        </DialogHeader>

        {/* Upload Section */}
        <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUploadClick}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload New Image'}
            </Button>
            {uploadError && (
              <p className="text-sm text-red-500">{uploadError}</p>
            )}
          </div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mediaList.map((file) => (
            <Card
              key={file.id}
              className="cursor-pointer hover:border-primary bg-white dark:bg-gray-950"
              onClick={() => onSelect(getImageUrl(file))}
            >
              <CardContent className="p-2">
                <img
                  src={getImageUrl(file)}
                  alt={file.name}
                  className="w-full h-32 object-cover rounded"
                />
                <p className="text-sm mt-2 truncate text-gray-900 dark:text-gray-100">{file.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
