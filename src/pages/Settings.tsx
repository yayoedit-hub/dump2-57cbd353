import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, 
  Music, 
  Loader2,
  Save,
  Plus,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const GENRES = ["Hip Hop", "Trap", "R&B", "Drill", "Pop", "Electronic", "Lo-Fi", "Soul", "House", "Techno"];

type UserRole = "subscriber" | "creator" | "both";

export default function Settings() {
  const { user, profile, creator, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [role, setRole] = useState<UserRole>("subscriber");
  
  // Creator state
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [licenseType, setLicenseType] = useState<"personal_only" | "commercial_with_credit">("personal_only");
  const [backCatalogAccess, setBackCatalogAccess] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [creatingCreator, setCreatingCreator] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setRole(profile.role || "subscriber");
    }
    if (creator) {
      setHandle(creator.handle);
      setBio(creator.bio || "");
      setPriceUsd(creator.price_usd?.toString() || "5");
      setSelectedTags(creator.tags || []);
      setLicenseType(creator.license_type || "personal_only");
      setBackCatalogAccess(creator.back_catalog_access ?? true);
    }
  }, [profile, creator]);

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

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${user.id}/avatar.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = data.publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl,
          role: role,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profile updated");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCreator = async () => {
    if (!user || !handle.trim()) {
      toast.error("Handle is required");
      return;
    }

    setCreatingCreator(true);

    try {
      // Check if handle is unique
      const { data: existingCreator } = await supabase
        .from("creators")
        .select("id")
        .eq("handle", handle.trim().toLowerCase())
        .maybeSingle();

      if (existingCreator) {
        toast.error("This handle is already taken");
        setCreatingCreator(false);
        return;
      }

      const { error } = await supabase
        .from("creators")
        .insert({
          user_id: user.id,
          handle: handle.trim().toLowerCase(),
          bio: bio.trim() || null,
          price_usd: parseInt(priceUsd) || 5,
          tags: selectedTags,
          license_type: licenseType,
          back_catalog_access: backCatalogAccess,
        });

      if (error) throw error;

      // Update role to include creator
      await supabase
        .from("profiles")
        .update({ role: role === "subscriber" ? "creator" : "both" })
        .eq("id", user.id);

      await refreshProfile();
      toast.success("Creator profile created!");
    } catch (error) {
      console.error("Create creator error:", error);
      toast.error("Failed to create creator profile");
    } finally {
      setCreatingCreator(false);
    }
  };

  const handleSaveCreator = async () => {
    if (!creator) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("creators")
        .update({
          bio: bio.trim() || null,
          price_usd: parseInt(priceUsd) || 5,
          tags: selectedTags,
          license_type: licenseType,
          back_catalog_access: backCatalogAccess,
        })
        .eq("id", creator.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Creator settings saved");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save creator settings");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-32 bg-secondary rounded" />
            <div className="h-96 bg-secondary rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const isCreator = profile?.role === "creator" || profile?.role === "both";
  const showCreatorSetup = (role === "creator" || role === "both") && !creator;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="creator" className="gap-2">
              <Music className="h-4 w-4" />
              Creator
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
              />
              {profile?.avatar_url && !avatarFile && (
                <p className="text-sm text-muted-foreground">
                  Current avatar set
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscriber">Subscriber only</SelectItem>
                  <SelectItem value="creator">Creator only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how you want to use Dump
              </p>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Profile
            </Button>
          </TabsContent>

          {/* Creator Tab */}
          <TabsContent value="creator" className="space-y-6">
            {showCreatorSetup ? (
              // Creator Setup Form
              <div className="p-6 rounded-xl border border-border bg-card">
                <h2 className="text-xl font-semibold mb-4">Create Your Creator Profile</h2>
                <p className="text-muted-foreground mb-6">
                  Set up your creator profile to start uploading dump packs.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="handle">Handle *</Label>
                    <Input
                      id="handle"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                      placeholder="yourhandle"
                    />
                    <p className="text-sm text-muted-foreground">
                      Your unique creator URL: dump.app/creator/{handle || "yourhandle"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell subscribers about your style..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Monthly Price (USD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min={1}
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Genres</Label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map(genre => (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleTag(genre)}
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
                  </div>

                  <div className="space-y-2">
                    <Label>License Type</Label>
                    <Select value={licenseType} onValueChange={(v) => setLicenseType(v as typeof licenseType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="personal_only">Personal use only</SelectItem>
                        <SelectItem value="commercial_with_credit">Commercial with credit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Back Catalog Access</Label>
                      <p className="text-sm text-muted-foreground">
                        Let new subscribers access all past dumps
                      </p>
                    </div>
                    <Switch
                      checked={backCatalogAccess}
                      onCheckedChange={setBackCatalogAccess}
                    />
                  </div>

                  <Button onClick={handleCreateCreator} disabled={creatingCreator} className="w-full">
                    {creatingCreator ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    Create Creator Profile
                  </Button>
                </div>
              </div>
            ) : creator ? (
              // Existing Creator Settings
              <>
                <div className="p-4 rounded-lg bg-secondary/50 mb-6">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Your creator handle:</span>{" "}
                    <span className="font-medium">@{creator.handle}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell subscribers about your style..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Monthly Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    min={1}
                    value={priceUsd}
                    onChange={(e) => setPriceUsd(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Genres</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {GENRES.map(genre => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleTag(genre)}
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
                    />
                    <Button type="button" variant="outline" onClick={addCustomTag}>
                      Add
                    </Button>
                  </div>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button type="button" onClick={() => toggleTag(tag)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>License Type</Label>
                  <Select value={licenseType} onValueChange={(v) => setLicenseType(v as typeof licenseType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal_only">Personal use only</SelectItem>
                      <SelectItem value="commercial_with_credit">Commercial with credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Back Catalog Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Let new subscribers access all past dumps
                    </p>
                  </div>
                  <Switch
                    checked={backCatalogAccess}
                    onCheckedChange={setBackCatalogAccess}
                  />
                </div>

                <Button onClick={handleSaveCreator} disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Creator Settings
                </Button>
              </>
            ) : (
              // Not a creator role
              <div className="py-12 text-center">
                <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Become a Creator</h3>
                <p className="text-muted-foreground mb-4">
                  Change your role to "Creator" or "Both" to start uploading dump packs.
                </p>
                <p className="text-sm text-muted-foreground">
                  Go to Profile tab and update your role.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
