import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { getUser, isUserLoggedIn } from "~/lib/supabase/auth.supabase.server";
import { createSupabaseServerClient } from "~/lib/supabase/supabase.server";
import { Button } from "~/components/ui/button";
import { AdminMenu } from "~/components/admin-menu";
import { getLocale } from "~/i18n/i18n.server";
import enTranslations from "~/i18n/locales/en.json";
import viTranslations from "~/i18n/locales/vi.json";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { X } from "lucide-react";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

type FileWithPreview = {
  file: File;
  preview: string;
  compressedFile?: File;
  compressionProgress: number;
  originalSize: number;
  compressedSize: number;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if user is logged in
  if (!(await isUserLoggedIn(request))) {
    throw redirect("/login");
  }

  // Get user data
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }

  // Get user's profile to check role
  const supabase = createSupabaseServerClient(request);
  const { data: profile, error } = await supabase.client
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error || !profile) {
    throw redirect("/user");
  }

  // Check if user has admin role
  if (profile.role !== 'admin') {
    throw redirect("/user");
  }

  // Get current locale
  const locale = await getLocale(request);
  
  return json({ 
    user, 
    profile,
    locale,
    t: translations[locale].admin
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (files.length === 0) {
    return json({ error: "No files provided" });
  }

  const supabase = createSupabaseServerClient(request);
  const uploadResults = [];

  for (const file of files) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      uploadResults.push({ error: `${file.name}: Not an image file` });
      continue;
    }

    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      // Upload file to Supabase storage
      const { data, error } = await supabase.client
        .storage
        .from('post-medias')
        .upload(`${Date.now()}-${file.name}`, fileBuffer, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        uploadResults.push({ error: `${file.name}: ${error.message}` });
      } else {
        uploadResults.push({ success: true, name: file.name });
      }
    } catch (error) {
      console.error('Upload error:', error);
      uploadResults.push({ error: `${file.name}: Upload failed` });
    }
  }

  // If all uploads failed, return error
  if (uploadResults.every(result => 'error' in result)) {
    return json({ error: "All uploads failed" });
  }

  // If some uploads succeeded, redirect to media page
  return redirect("/admin/media");
};

export default function UploadMedia() {
  const { user, profile, locale, t } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isUploading = navigation.state === "submitting";
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    // Filter out non-image files and files larger than 10MB
    const validFiles = newFiles.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );

    // Create preview URLs for valid files
    const filesWithPreview = await Promise.all(
      validFiles.map(async (file) => {
        const preview = URL.createObjectURL(file);
        return {
          file,
          preview,
          compressionProgress: 0,
          originalSize: file.size,
          compressedSize: 0
        };
      })
    );

    setFiles(prev => [...prev, ...filesWithPreview]);

    // Compress each file
    for (const fileWithPreview of filesWithPreview) {
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress: number) => {
            setFiles(prev => prev.map(f => 
              f.file === fileWithPreview.file 
                ? { ...f, compressionProgress: progress }
                : f
            ));
          }
        };

        const compressedFile = await imageCompression(fileWithPreview.file, options);
        
        setFiles(prev => prev.map(f => 
          f.file === fileWithPreview.file 
            ? { 
                ...f, 
                compressedFile,
                compressedSize: compressedFile.size,
                compressionProgress: 100
              }
            : f
        ));
      } catch (error) {
        console.error('Compression error:', error);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 max-w-7xl">
      <div className="grid gap-4 md:gap-6 md:grid-cols-[300px_1fr]">
        {/* Admin Menu */}
        <div className="md:block">
          <AdminMenu t={t} />
        </div>

        {/* Main Content */}
        <div className="space-y-4 md:space-y-6">
          {/* Header Section */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{t.menu.media.upload}</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Upload new media files
              </p>
            </div>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/admin/media">
                Back to Media Library
              </Link>
            </Button>
          </div>

          {/* Upload Form */}
          <div className="bg-card rounded-lg border shadow-sm">
            <div className="p-4 sm:p-6">
              {actionData?.error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{actionData.error}</AlertDescription>
                </Alert>
              )}
              <Form method="post" encType="multipart/form-data" className="space-y-4">
                <div>
                  <Label htmlFor="files">Select Files</Label>
                  <Input
                    id="files"
                    name="files"
                    type="file"
                    accept="image/*"
                    multiple
                    required
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="space-y-3">
                    {files.map((fileWithPreview, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        {/* Preview */}
                        <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                          <img
                            src={fileWithPreview.preview}
                            alt={fileWithPreview.file.name}
                            className="w-full h-full object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <X className="h-3 w-3 md:h-4 md:w-4" />
                          </button>
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="text-sm font-medium truncate">
                            {fileWithPreview.file.name}
                          </div>
                          
                          {/* Compression Progress */}
                          {fileWithPreview.compressionProgress > 0 && fileWithPreview.compressionProgress < 100 && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Compressing... {Math.round(fileWithPreview.compressionProgress)}%
                              </div>
                              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${fileWithPreview.compressionProgress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Size Info */}
                          {fileWithPreview.compressedSize > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Original: {(fileWithPreview.originalSize / 1024 / 1024).toFixed(2)}MB
                              <br />
                              Compressed: {(fileWithPreview.compressedSize / 1024 / 1024).toFixed(2)}MB
                              <br />
                              Ratio: {((1 - fileWithPreview.compressedSize / fileWithPreview.originalSize) * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button type="submit" disabled={isUploading || files.length === 0} className="w-full sm:w-auto">
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 