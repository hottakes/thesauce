import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Play, Image as ImageIcon, Video, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ContentUploaderProps {
  applicantId?: string;
  contentUrls: string[];
  onContentChange: (urls: string[]) => void;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

export const ContentUploader = ({ applicantId, contentUrls, onContentChange }: ContentUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const isValidFileType = (file: File) => {
    return [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].includes(file.type);
  };

  const isVideoFile = (url: string) => {
    return url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!isValidFileType(file)) {
      toast({
        title: "Invalid file type",
        description: "Only images (jpg, png, webp, gif) and videos (mp4, mov, webm) are allowed.",
        variant: "destructive",
      });
      return null;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB.",
        variant: "destructive",
      });
      return null;
    }

    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `${applicantId || 'temp'}_${timestamp}_${file.name}`;
    const filePath = `${applicantId || 'temp'}/${fileName}`;

    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

    try {
      const { data, error } = await supabase.storage
        .from('applicant-content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Simulate progress since Supabase doesn't provide real progress
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

      const { data: urlData } = supabase.storage
        .from('applicant-content')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[file.name];
        return newProgress;
      });
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const remainingSlots = MAX_FILES - contentUrls.length;
    
    if (fileArray.length > remainingSlots) {
      toast({
        title: "Too many files",
        description: `You can only upload ${remainingSlots} more file(s).`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of fileArray) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 10 }));
      const url = await uploadFile(file);
      if (url) {
        newUrls.push(url);
      }
    }

    if (newUrls.length > 0) {
      onContentChange([...contentUrls, ...newUrls]);
    }
    setUploading(false);
  };

  const removeFile = async (url: string) => {
    // Extract file path from URL
    const urlParts = url.split('/applicant-content/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('applicant-content').remove([filePath]);
    }
    onContentChange(contentUrls.filter(u => u !== url));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [contentUrls]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-semibold">Drop your best content</h3>
      <p className="text-sm text-muted-foreground">
        Photos, videos, TikToks, whatever shows your vibe. Max 5 files.
      </p>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass-card p-8 rounded-2xl text-center transition-all border-2 border-dashed ${
          isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
        } ${contentUrls.length >= MAX_FILES ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
      >
        <input
          type="file"
          id="content-upload"
          multiple
          accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_VIDEO_TYPES].join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={uploading || contentUrls.length >= MAX_FILES}
        />
        <label htmlFor="content-upload" className="cursor-pointer">
          {uploading ? (
            <Loader2 className="w-10 h-10 mx-auto mb-3 text-primary animate-spin" />
          ) : (
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          )}
          <p className="font-medium mb-1">
            {uploading ? "Uploading..." : "Drag & drop or click to upload"}
          </p>
          <p className="text-sm text-muted-foreground">
            {contentUrls.length}/{MAX_FILES} uploaded
          </p>
        </label>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([name, progress]) => (
            <div key={name} className="glass-card p-3 rounded-xl">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="truncate max-w-[200px]">{name}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content Preview Grid */}
      {contentUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {contentUrls.map((url, index) => (
            <motion.div
              key={url}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-secondary group"
            >
              {isVideoFile(url) ? (
                <div 
                  className="w-full h-full flex items-center justify-center bg-secondary cursor-pointer"
                  onClick={() => setPreviewUrl(url)}
                >
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Content ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewUrl(url)}
                />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(url);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewUrl(null)}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="w-6 h-6" />
            </button>
            {isVideoFile(previewUrl) ? (
              <video
                src={previewUrl}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-[80vh] rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
