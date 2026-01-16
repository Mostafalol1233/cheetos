
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface HeaderImageEditorProps {
  currentImageUrl?: string;
  onSave: (newUrl: string) => void;
}

export function HeaderImageEditor({ currentImageUrl, onSave }: HeaderImageEditorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      
      // Validate dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 1200 || img.height < 200) {
          toast({
            title: "Low Resolution Warning",
            description: "Image is smaller than recommended 1920x300px. It may appear blurry.",
            variant: "destructive", // Using destructive color for visibility, or default
          });
        } else if (Math.abs(img.width / img.height - 1920 / 300) > 0.5) {
           toast({
            title: "Aspect Ratio Warning",
            description: "Image aspect ratio differs from recommended 1920x300px (6.4:1). It may be cropped.",
          });
        }
      };
      img.src = url;

      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      // Get the token if it exists (though usually cookie based)
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const uploadRes = await fetch("/api/header-images/upload", {
        method: "POST",
        headers,
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(errorText || "Upload failed");
      }

      const data = await uploadRes.json();
      const imageUrl = data.imageUrl;

      // Save metadata via the standard apiRequest which handles JSON
      await apiRequest("POST", "/api/header-images/save", {
        imageUrl,
        cropData: {
            originalName: selectedFile.name,
            size: selectedFile.size,
            type: selectedFile.type
        }
      });

      onSave(imageUrl);
      toast({
        title: "Success",
        description: "Header image updated successfully",
      });
      setSelectedFile(null);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button 
            type="button"
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
        >
            <Upload className="mr-2 h-4 w-4" />
            Change Header Image
        </Button>
        <Input 
            ref={fileInputRef}
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            className="hidden"
            onChange={handleFileSelect}
        />
        {selectedFile && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
                {selectedFile.name}
                <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(currentImageUrl || null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                >
                    <X className="h-3 w-3" />
                </Button>
            </span>
        )}
      </div>

      <Card className="overflow-hidden border-dashed">
        <CardContent className="p-0">
            <div className="relative w-full h-[200px] bg-muted flex items-center justify-center">
                 {previewUrl ? (
                    <img 
                        src={previewUrl} 
                        alt="Header Preview" 
                        className="w-full h-full object-cover"
                    />
                 ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <span>No header image selected</span>
                    </div>
                 )}
            </div>
        </CardContent>
      </Card>

      {selectedFile && (
          <div className="flex justify-end gap-2">
              <Button 
                type="button"
                onClick={handleUpload} 
                disabled={isUploading}
              >
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? "Uploading..." : "Save New Header"}
              </Button>
          </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Recommended size: 1920x300px. Supported formats: JPG, PNG, WEBP.
      </p>
    </div>
  );
}
