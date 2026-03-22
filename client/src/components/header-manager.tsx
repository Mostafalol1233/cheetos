import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Upload, X, ImageIcon, Loader2, Save, Trash2, History, RotateCcw, Check, Clock } from "lucide-react";
import { apiRequest, API_BASE_URL } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { io } from "socket.io-client";

interface HeaderVersion {
  id: string;
  image_url: string;
  heading_text: string;
  button_text: string;
  button_url: string;
  created_at: string;
  is_active: boolean;
  archived: boolean;
}

export function HeaderManager() {
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [headingText, setHeadingText] = useState("Level up your game");
  const [buttonText, setButtonText] = useState("Shop Now");
  const [buttonUrl, setButtonUrl] = useState("/games");

  const [versions, setVersions] = useState<HeaderVersion[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchVersions();

    // Socket listener for real-time updates
    const socket = io(API_BASE_URL, {
      transports: ['polling'],
      upgrade: false,
      reconnectionAttempts: 5,
      path: '/socket.io'
    });

    socket.on('header_updated', () => {
      fetchVersions();
      toast({
        title: "Updated",
        description: "Header configuration updated by another admin.",
      });
    });

    return () => {
      socket.off('header_updated');
      socket.disconnect();
    };
  }, []);

  // When versions load, if we have an active one, populate the editor with it
  useEffect(() => {
    const active = versions.find(v => v.is_active);
    if (active) {
      setImageUrl(active.image_url);
      setHeadingText(active.heading_text || "Level up your game");
      setButtonText(active.button_text || "Shop Now");
      setButtonUrl(active.button_url || "/games");
    }
  }, [versions]);

  const fetchVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const token = localStorage.getItem("adminToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/header-images/versions", { headers });
      if (!res.ok) throw new Error("Failed to fetch versions");
      const data = await res.json();
      setVersions(data);
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setIsLoadingVersions(false);
    }
  };

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

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (img.width < 800 || img.height < 400) {
          toast({
            title: "Image too small",
            description: "Image should be at least 800x400 pixels for best quality",
            variant: "destructive", // Warning but allow? Or block. Let's block for now as "Validation"
          });
          // return; // Uncomment to strictly enforce
        }
        const url = URL.createObjectURL(file);
        setSelectedFile(file);
        setImageUrl(url);
      };
      img.onerror = () => {
        toast({
          title: "Invalid image",
          description: "Could not load image",
          variant: "destructive",
        });
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return imageUrl; // Return existing URL if no new file

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      const token = localStorage.getItem("adminToken");
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
      return data.imageUrl;
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!imageUrl && !selectedFile) {
      toast({
        title: "Missing Image",
        description: "Please select an image for the header.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload image if needed
      const uploadedImageUrl = await uploadImage();
      if (!uploadedImageUrl) return; // Error handled in uploadImage

      // 2. Save version
      const token = localStorage.getItem("adminToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/header-images/save-version", {
        method: "POST",
        headers,
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          headingText: headingText || "Level up your game",
          buttonText: buttonText || "Shop Now",
          buttonUrl: buttonUrl || "/games",
          isActive: true // Auto-activate for now, or we could have a checkbox
        }),
      });

      if (!res.ok) throw new Error("Failed to save version");

      const newVersion = await res.json();

      toast({
        title: "Success",
        description: "Header updated successfully",
      });

      // Refresh versions
      fetchVersions();
      setSelectedFile(null);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save header",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this version? It can be recovered from the archive.")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/header-images/versions/${id}`, {
        method: "DELETE",
        headers
      });

      toast({ title: "Archived", description: "Version moved to archive" });
      fetchVersions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete version", variant: "destructive" });
    }
  };

  /* REMOVED handleActivate (legacy) to prevent conflicts, or if you want to keep it: */
  const handleActivate = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/header-images/versions/${id}/activate`, {
        method: "POST",
        headers
      });

      toast({ title: "Activated", description: "Header version is now live" });
      fetchVersions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to activate version", variant: "destructive" });
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/header-images/versions/${id}/deactivate`, {
        method: "POST",
        headers
      });

      toast({ title: "Deactivated", description: "Header version is no longer live" });
      fetchVersions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to deactivate version", variant: "destructive" });
    }
  };

  const loadVersionIntoEditor = (v: HeaderVersion) => {
    setImageUrl(v.image_url);
    setHeadingText(v.heading_text);
    setButtonText(v.button_text);
    setButtonUrl(v.button_url);
    setActiveTab("editor");
    toast({ title: "Loaded", description: "Version loaded into editor. Click Save to publish changes." });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="editor">Editor & Preview</TabsTrigger>
          <TabsTrigger value="history">History & Versions</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-6">
          {/* Preview Section */}
          <Card className="overflow-hidden border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>This is how your header will look on the site.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 relative group">
              <div className="relative w-full h-[300px] bg-muted flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Header Preview"
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                    />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4 text-center">
                      <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg max-w-2xl">
                        {headingText}
                      </h1>
                      <Button
                        size="lg"
                        className="bg-gold-primary text-black hover:bg-gold-secondary font-bold text-lg px-8 py-6 rounded-full transition-all hover:scale-105"
                      >
                        {buttonText}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                    <span>No header image selected</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Editor Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Image Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-dashed"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-6 w-6" />
                      <span>Upload New Image</span>
                      <span className="text-xs text-muted-foreground">1920x300px recommended</span>
                    </div>
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {selectedFile && (
                    <Alert>
                      <ImageIcon className="h-4 w-4" />
                      <AlertTitle>Selected File</AlertTitle>
                      <AlertDescription className="flex justify-between items-center">
                        {selectedFile.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null);
                            // Reset to active version image if available, or empty
                            const active = versions.find(v => v.is_active);
                            setImageUrl(active?.image_url || "");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content & Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Heading Text</label>
                  <Textarea
                    value={headingText}
                    onChange={(e) => setHeadingText(e.target.value)}
                    placeholder="Level up your game"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Button Text</label>
                    <Input
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder="Shop Now"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Button URL</label>
                    <Input
                      value={buttonUrl}
                      onChange={(e) => setButtonUrl(e.target.value)}
                      placeholder="/games"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSaveVersion}
                  disabled={isSaving || isUploading}
                  className="w-full bg-primary"
                >
                  {(isSaving || isUploading) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save & Publish Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>View, restore, or manage previous header configurations.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {isLoadingVersions ? (
                    <div className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : versions.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No history available yet.
                    </div>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className={`flex flex-col md:flex-row gap-4 p-4 rounded-lg border ${version.is_active ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <div className="w-full md:w-48 h-24 bg-muted rounded-md overflow-hidden flex-shrink-0 relative">
                          <img
                            src={version.image_url}
                            alt="Version preview"
                            className="w-full h-full object-cover"
                          />
                          {version.is_active && (
                            <div className="absolute top-2 left-2 flex gap-1">
                              <Badge variant="default" className="bg-green-600">Active</Badge>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-5 w-5 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(version.id);
                                }}
                                title="Delete (Archive)"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{version.heading_text}</h4>
                          </div>
                          <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                            <span>Button: {version.button_text} ({version.button_url})</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(version.created_at), "PPP p")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadVersionIntoEditor(version)}
                            title="Edit this version"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          {!version.is_active && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActivate(version.id)}
                                title="Activate this version"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(version.id)}
                                title="Archive version"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
