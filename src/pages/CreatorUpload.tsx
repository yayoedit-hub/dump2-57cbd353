import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Upload, 
  Music, 
  FileArchive, 
  AlertTriangle,
  X,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const KEYS = [
  "C Major", "C Minor", "C# Major", "C# Minor",
  "D Major", "D Minor", "D# Major", "D# Minor",
  "E Major", "E Minor",
  "F Major", "F Minor", "F# Major", "F# Minor",
  "G Major", "G Minor", "G# Major", "G# Minor",
  "A Major", "A Minor", "A# Major", "A# Minor",
  "B Major", "B Minor",
];

const GENRES = ["Hip Hop", "Trap", "R&B", "Drill", "Pop", "Electronic", "Lo-Fi", "Soul", "House", "Techno"];

type PackType = "flp_only" | "zipped_project" | "compatible_pack";

export default function CreatorUpload() {
  const { creator, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [packType, setPackType] = useState<PackType>("zipped_project");
  const [hasRights, setHasRights] = useState(false);
  
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);
  const [midiFile, setMidiFile] = useState<File | null>(null);
  
  const [uploading, setUploading] = useState(false);

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="h-96 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Creator Access Required</h1>
          <p className="text-muted-foreground mb-6">
            You need to become a creator to upload dump packs.
          </p>
          <Button onClick={() => navigate("/settings")}>
            Go to Settings
          </Button>
        </div>
      </Layout>
    );
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag && !selectedTags.includes(customTag)) {
      setSelectedTags(prev => [...prev, customTag]);
      setCustomTag("");
    }
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return "Title is required";
    if (!bpm || isNaN(parseInt(bpm)) || parseInt(bpm) < 1) return "Valid BPM is required";
    if (!previewFile) return "Preview audio is required";
    if (!hasRights) return "You must confirm you have rights to share this content";
    
    if (packType === "flp_only" && !projectFile) {
      return "FLP file is required for FLP Only pack type";
    }
    if ((packType === "zipped_project" || packType === "compatible_pack") && !projectFile) {
      return "Project ZIP is required";
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    setUploading(true);

    try {
      // Create dump_pack row first to get ID
      const { data: packData, error: packError } = await supabase
        .from("dump_packs")
        .insert({
          creator_id: creator.id,
          title: title.trim(),
          description: description.trim() || null,
          bpm: parseInt(bpm),
          key: key || null,
          tags: selectedTags,
          pack_type: packType,
          preview_path: "", // Will update after upload
        })
        .select()
        .single();

      if (packError || !packData) {
        throw new Error("Failed to create pack record");
      }

      const packId = packData.id;
      const basePath = `${creator.id}/${packId}`;

      // Upload preview to public previews bucket
      const previewExt = previewFile!.name.split('.').pop();
      const previewPath = `${basePath}/preview.${previewExt}`;
      
      const { error: previewUploadError } = await supabase.storage
        .from("previews")
        .upload(previewPath, previewFile!);

      if (previewUploadError) {
        throw new Error("Failed to upload preview: " + previewUploadError.message);
      }

      // Upload project file to private dumps bucket
      let projectPath: string | null = null;
      let flpPath: string | null = null;

      if (projectFile) {
        const projectExt = projectFile.name.split('.').pop()?.toLowerCase();
        
        if (packType === "flp_only" && projectExt === "flp") {
          flpPath = `${basePath}/project.flp`;
          const { error } = await supabase.storage.from("dumps").upload(flpPath, projectFile);
          if (error) throw new Error("Failed to upload FLP: " + error.message);
        } else {
          projectPath = `${basePath}/project.zip`;
          const { error } = await supabase.storage.from("dumps").upload(projectPath, projectFile);
          if (error) throw new Error("Failed to upload project: " + error.message);
        }
      }

      // Upload optional stems
      let stemsPath: string | null = null;
      if (stemsFile) {
        stemsPath = `${basePath}/stems.zip`;
        const { error } = await supabase.storage.from("dumps").upload(stemsPath, stemsFile);
        if (error) throw new Error("Failed to upload stems: " + error.message);
      }

      // Upload optional MIDI
      let midiPath: string | null = null;
      if (midiFile) {
        midiPath = `${basePath}/midi.zip`;
        const { error } = await supabase.storage.from("dumps").upload(midiPath, midiFile);
        if (error) throw new Error("Failed to upload MIDI: " + error.message);
      }

      // Update pack with file paths
      const { error: updateError } = await supabase
        .from("dump_packs")
        .update({
          preview_path: previewPath,
          project_zip_path: projectPath,
          flp_path: flpPath,
          stems_zip_path: stemsPath,
          midi_zip_path: midiPath,
        })
        .eq("id", packId);

      if (updateError) {
        throw new Error("Failed to update pack paths");
      }

      toast.success("Dump Pack uploaded successfully!");
      navigate(`/pack/${packId}`);

    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Upload Dump Pack</h1>
          <Link to="/how-to-upload" className="text-sm text-muted-foreground hover:text-foreground underline">
            How to upload?
          </Link>
        </div>
        <p className="text-muted-foreground mb-8">
          Share your unfinished projects with subscribers
        </p>

        {/* Warning Box */}
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 mb-8">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">For best compatibility:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Upload FL Studio "Zipped Project" (.zip) for best results</li>
                <li>"Compatible Pack" (stems + MIDI) gives the most value</li>
              </ul>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dark Trap Loop #47"
              disabled={uploading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Needs drop, drums could be better, melody is fire..."
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* BPM & Key */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM *</Label>
              <Input
                id="bpm"
                type="number"
                min={1}
                max={300}
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="140"
                disabled={uploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Select value={key} onValueChange={setKey} disabled={uploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent>
                  {KEYS.map(k => (
                    <SelectItem key={k} value={k}>{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {GENRES.map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleTag(genre)}
                  disabled={uploading}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    selectedTags.includes(genre)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                disabled={uploading}
              />
              <Button type="button" variant="outline" onClick={addCustomTag} disabled={uploading}>
                Add
              </Button>
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} disabled={uploading}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Pack Type */}
          <div className="space-y-2">
            <Label>Pack Type *</Label>
            <Select 
              value={packType} 
              onValueChange={(v) => setPackType(v as PackType)}
              disabled={uploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flp_only">FLP Only - Single .flp file</SelectItem>
                <SelectItem value="zipped_project">Zipped Project - FL Studio export with samples</SelectItem>
                <SelectItem value="compatible_pack">Compatible Pack - Project + optional stems/MIDI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Uploads */}
          <div className="space-y-4">
            <Label>Files</Label>
            
            {/* Preview Audio */}
            <div className="p-4 border border-dashed border-border rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Music className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Preview Audio *</p>
                  <p className="text-sm text-muted-foreground">MP3 or WAV, 30-90 seconds</p>
                </div>
              </div>
              <Input
                type="file"
                accept=".mp3,.wav"
                onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              {previewFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {previewFile.name}
                </p>
              )}
            </div>

            {/* Project File */}
            <div className="p-4 border border-dashed border-border rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <FileArchive className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {packType === "flp_only" ? "FLP File *" : "Project ZIP *"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {packType === "flp_only" 
                      ? ".flp file" 
                      : "FL Studio Zipped Project export"}
                  </p>
                </div>
              </div>
              <Input
                type="file"
                accept={packType === "flp_only" ? ".flp" : ".zip"}
                onChange={(e) => setProjectFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              {projectFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {projectFile.name}
                </p>
              )}
            </div>

            {/* Optional Stems */}
            <div className="p-4 border border-dashed border-border rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Stems ZIP (Optional)</p>
                  <p className="text-sm text-muted-foreground">Individual track exports</p>
                </div>
              </div>
              <Input
                type="file"
                accept=".zip"
                onChange={(e) => setStemsFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              {stemsFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {stemsFile.name}
                </p>
              )}
            </div>

            {/* Optional MIDI */}
            <div className="p-4 border border-dashed border-border rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">MIDI ZIP (Optional)</p>
                  <p className="text-sm text-muted-foreground">MIDI files for melodies/drums</p>
                </div>
              </div>
              <Input
                type="file"
                accept=".zip"
                onChange={(e) => setMidiFile(e.target.files?.[0] || null)}
                disabled={uploading}
              />
              {midiFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {midiFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Copyright Disclaimer */}
          <div className="p-4 rounded-lg border border-border">
            <div className="flex items-start gap-3">
              <Checkbox
                id="rights"
                checked={hasRights}
                onCheckedChange={(checked) => setHasRights(checked === true)}
                disabled={uploading}
                className="mt-0.5"
              />
              <Label htmlFor="rights" className="text-sm leading-relaxed cursor-pointer">
                I confirm that I own or have the rights to share all content included in this Dump Pack. I agree not to upload any copyrighted material that I do not have rights to share. I understand that I am solely responsible for any content I upload, and Dump is not liable for any copyright infringement claims arising from my uploads.
              </Label>
            </div>
          </div>

          {/* Submit */}
          <Button type="submit" size="lg" className="w-full" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Dump Pack
              </>
            )}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
