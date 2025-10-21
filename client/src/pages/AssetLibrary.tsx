import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Upload,
  Image,
  FileText,
  Video,
  Music,
  File,
  Download,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  FolderOpen,
  Link,
  Eye,
  Copy,
  Plus,
  X,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Asset } from "@shared/schema";

export default function AssetLibrary() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch assets
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { files: File[] }) => {
      const formData = new FormData();
      data.files.forEach(file => {
        formData.append('files', file);
      });
      
      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setSelectedFiles([]);
      setUploadDialogOpen(false);
      toast({
        title: "Assets uploaded",
        description: "Your files have been uploaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/assets/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      setSelectedAsset(null);
      toast({
        title: "Asset deleted",
        description: "The asset has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const getFileSize = (sizeKb: number | string | null) => {
    if (!sizeKb) return 'Unknown size';
    const kb = typeof sizeKb === 'string' ? parseFloat(sizeKb) : sizeKb;
    
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    } else if (kb < 1024 * 1024) {
      return `${(kb / 1024).toFixed(1)} MB`;
    } else {
      return `${(kb / (1024 * 1024)).toFixed(1)} GB`;
    }
  };

  const filteredAssets = assets.filter(asset => {
    if (filterType !== 'all' && !asset.fileType?.startsWith(filterType)) {
      return false;
    }
    if (searchQuery && !asset.fileName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate({ files: selectedFiles });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <FolderOpen className="h-4 w-4" />
          <span>Creative Production</span>
          <ChevronRight className="h-3 w-3" />
          <span>Asset Library</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Asset Library</h1>
        <p className="text-muted-foreground">
          Upload, organize, and manage your event assets and creative files
        </p>
      </div>

      {/* Toolbar */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-assets"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image/">Images</SelectItem>
                  <SelectItem value="video/">Videos</SelectItem>
                  <SelectItem value="audio/">Audio</SelectItem>
                  <SelectItem value="application/">Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
              
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="neon-glow" data-testid="button-upload">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Assets
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card">
                  <DialogHeader>
                    <DialogTitle>Upload Assets</DialogTitle>
                    <DialogDescription>
                      Select files to upload to your asset library
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Drag & drop files here, or click to select
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        data-testid="input-file-upload"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-select-files"
                      >
                        Select Files
                      </Button>
                    </div>
                    
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Files ({selectedFiles.length})</Label>
                        <ScrollArea className="h-[200px] glass rounded-lg p-3">
                          <div className="space-y-2">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getFileIcon(file.type)}
                                  <span className="text-sm truncate">{file.name}</span>
                                </div>
                                <Badge variant="secondary">{getFileSize(file.size)}</Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                      data-testid="button-confirm-upload"
                    >
                      {uploadMutation.isPending ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Display */}
      <div className="space-y-6">
        {filteredAssets.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== 'all'
                  ? "No assets match your filters"
                  : "No assets uploaded yet"}
              </p>
              {!searchQuery && filterType === 'all' && (
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Asset
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.map((asset) => (
              <Card
                key={asset.id}
                className="glass-card hover-elevate cursor-pointer"
                onClick={() => setSelectedAsset(asset)}
                data-testid={`card-asset-${asset.id}`}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                    {asset.fileType?.startsWith('image/') && asset.thumbnailUrl ? (
                      <img
                        src={asset.thumbnailUrl}
                        alt={asset.fileName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        {getFileIcon(asset.fileType || 'application/octet-stream')}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-sm truncate">{asset.fileName}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{getFileSize(asset.sizeKb)}</span>
                      <span>{format(new Date(asset.createdAt), "MMM dd")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="divide-y">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-4 hover-elevate cursor-pointer flex items-center justify-between"
                      onClick={() => setSelectedAsset(asset)}
                      data-testid={`row-asset-${asset.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          {getFileIcon(asset.fileType || 'application/octet-stream')}
                        </div>
                        <div>
                          <p className="font-medium">{asset.fileName}</p>
                          <p className="text-sm text-muted-foreground">
                            {getFileSize(asset.sizeKb)} • {format(new Date(asset.createdAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(asset.fileUrl, '_blank');
                          }}
                          data-testid={`button-download-${asset.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(asset.fileUrl);
                          }}
                          data-testid={`button-copy-${asset.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Asset Details Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="glass-card max-w-3xl">
          {selectedAsset && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getFileIcon(selectedAsset.fileType || '')}
                  {selectedAsset.fileName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedAsset.fileType?.startsWith('image/') && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={selectedAsset.fileUrl}
                      alt={selectedAsset.fileName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">File Size</Label>
                    <p className="font-medium">{getFileSize(selectedAsset.sizeKb)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Type</Label>
                    <p className="font-medium">{selectedAsset.fileType || 'Unknown'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Uploaded</Label>
                    <p className="font-medium">
                      {format(new Date(selectedAsset.createdAt), "MMMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  {selectedAsset.projectId && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Project ID</Label>
                      <p className="font-medium">{selectedAsset.projectId}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Asset URL</Label>
                  <div className="flex gap-2">
                    <Input value={selectedAsset.fileUrl} readOnly />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(selectedAsset.fileUrl)}
                      data-testid="button-copy-url"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(selectedAsset.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-asset"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteMutation.isPending ? "Deleting..." : "Delete Asset"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedAsset.fileUrl, '_blank')}
                  data-testid="button-open-asset"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Open Original
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}