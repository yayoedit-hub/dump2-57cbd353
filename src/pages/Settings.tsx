import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
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
  X,
  Link,
  Cloud,
  Globe,
  Instagram,
  Youtube,
  ImageIcon,
  Moon,
  Sun,
  Palette
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SocialLinks } from "@/components/SocialLinks";
import { BannerCropper } from "@/components/BannerCropper";
import { AvatarCropper } from "@/components/AvatarCropper";

const GENRES = ["Hip Hop", "Trap", "R&B", "Drill", "Pop", "Electronic", "Lo-Fi", "Soul", "House", "Techno"];

type UserRole = "subscriber" | "creator" | "both";

export default function Settings() {
  const { user, profile, creator, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);
  const [tempAvatarFile, setTempAvatarFile] = useState<File | null>(null);
  const [role, setRole] = useState<UserRole>("subscriber");
  
  // Creator state
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [licenseType, setLicenseType] = useState<"personal_only" | "commercial_with_credit">("personal_only");
  const [backCatalogAccess, setBackCatalogAccess] = useState(true);
  
  // Social links state
  const [soundcloudUrl, setSoundcloudUrl] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  
  // Banner state
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [showBannerCropper, setShowBannerCropper] = useState(false);
  const [tempBannerFile, setTempBannerFile] = useState<File | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [creatingCreator, setCreatingCreator] = useState(false);

  const validateUrl = (url: string): boolean => {
    if (!url) return true;
    return url.startsWith("https://");
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setRole(profile.role || "subscriber");
      setAvatarPreview(profile.avatar_url || null);
    }
    if (creator) {
      setHandle(creator.handle);
      setBio(creator.bio || "");
      setPriceUsd(creator.price_usd?.toString() || "5");
      setSelectedTags(creator.tags || []);
      setLicenseType(creator.license_type || "personal_only");
      setBackCatalogAccess(creator.back_catalog_access ?? true);
      setSoundcloudUrl(creator.soundcloud_url || "");
      setSpotifyUrl(creator.spotify_url || "");
      setWebsiteUrl(creator.website_url || "");
      setInstagramUrl(creator.instagram_url || "");
      setYoutubeUrl(creator.youtube_url || "");
      setBannerPreview(creator.banner_url || null);
    }
  }, [profile, creator]);

  const handleAvatarSelect = (file: File | null) => {
    if (file) {
      setTempAvatarFile(file);
      setShowAvatarCropper(true);
    }
  };

  const handleAvatarCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "avatar.png", { type: "image/png" });
    setAvatarFile(croppedFile);
    setAvatarPreview(URL.createObjectURL(croppedBlob));
    setShowAvatarCropper(false);
    setTempAvatarFile(null);
  };

  const handleAvatarCropCancel = () => {
    setShowAvatarCropper(false);
    setTempAvatarFile(null);
  };

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

      const parsedPrice = priceUsd === "" ? 5 : parseInt(priceUsd);
      const finalPrice = isNaN(parsedPrice) ? 5 : parsedPrice;

      const { data: newCreator, error } = await supabase
        .from("creators")
        .insert({
          user_id: user.id,
          handle: handle.trim().toLowerCase(),
          bio: bio.trim() || null,
          price_usd: finalPrice,
          tags: selectedTags,
          license_type: licenseType,
          back_catalog_access: backCatalogAccess,
        })
        .select()
        .single();

      if (error) throw error;

      // Update role to include creator
      await supabase
        .from("profiles")
        .update({ role: role === "subscriber" ? "creator" : "both" })
        .eq("id", user.id);

      // Create Stripe product and price (only if price > 0)
      if (finalPrice > 0) {
        const { error: stripeError } = await supabase.functions.invoke("create-stripe-price", {
          body: { creator_id: newCreator.id, price_usd: finalPrice }
        });

        if (stripeError) {
          console.error("Stripe setup error:", stripeError);
          toast.warning("Creator profile created, but Stripe setup failed. Update your price in settings to retry.");
        } else {
          toast.success("Creator profile created with Stripe pricing!");
        }
      } else {
        toast.success("Creator profile created! Subscriptions are free.");
      }

      await refreshProfile();
    } catch (error) {
      console.error("Create creator error:", error);
      toast.error("Failed to create creator profile");
    } finally {
      setCreatingCreator(false);
    }
  };

  const handleBannerSelect = (file: File | null) => {
    if (file) {
      setTempBannerFile(file);
      setShowBannerCropper(true);
    }
  };

  const handleBannerCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "banner.jpg", { type: "image/jpeg" });
    setBannerFile(croppedFile);
    setBannerPreview(URL.createObjectURL(croppedBlob));
    setShowBannerCropper(false);
    setTempBannerFile(null);
  };

  const handleBannerCropCancel = () => {
    setShowBannerCropper(false);
    setTempBannerFile(null);
  };

  const handleSaveCreator = async () => {
    if (!creator || !user) return;
    
    // Validate URLs
    const urls = [
      { url: soundcloudUrl, name: "SoundCloud" },
      { url: spotifyUrl, name: "Spotify" },
      { url: websiteUrl, name: "Website" },
      { url: instagramUrl, name: "Instagram" },
      { url: youtubeUrl, name: "YouTube" },
    ];
    
    for (const { url, name } of urls) {
      if (url && !validateUrl(url)) {
        toast.error(`${name} URL must start with https://`);
        return;
      }
    }
    
    setSaving(true);

    try {
      let bannerUrl = creator.banner_url;

      // Upload banner if changed
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop();
        const path = `${creator.id}/banner.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, bannerFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        bannerUrl = data.publicUrl;
      }
      const parsedPrice = priceUsd === "" ? 5 : parseInt(priceUsd);
      const newPrice = isNaN(parsedPrice) ? 5 : parsedPrice;
      const priceChanged = newPrice !== creator.price_usd;

      // If price changed, update Stripe price (only if price > 0)
      if (priceChanged) {
        if (newPrice > 0) {
          const { data, error: stripeError } = await supabase.functions.invoke("create-stripe-price", {
            body: { creator_id: creator.id, price_usd: newPrice }
          });

          if (stripeError) {
            throw new Error(stripeError.message || "Failed to update Stripe price");
          }

          toast.success("Stripe pricing updated!");
        } else {
          // Update price_usd to 0 directly (no Stripe price needed for free)
          const { error: updateError } = await supabase
            .from("creators")
            .update({ price_usd: 0 })
            .eq("id", creator.id);
          
          if (updateError) throw updateError;
          toast.success("Subscriptions are now free!");
        }
      }
      
      // Update creator fields including social links and banner
      const { error } = await supabase
        .from("creators")
        .update({
          bio: bio.trim() || null,
          tags: selectedTags,
          license_type: licenseType,
          back_catalog_access: backCatalogAccess,
          soundcloud_url: soundcloudUrl.trim() || null,
          spotify_url: spotifyUrl.trim() || null,
          website_url: websiteUrl.trim() || null,
          instagram_url: instagramUrl.trim() || null,
          youtube_url: youtubeUrl.trim() || null,
          banner_url: bannerUrl,
        })
        .eq("id", creator.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Creator settings saved");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save creator settings");
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
          <TabsList className="mb-6 w-full flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="profile" className="gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm">
              <User className="h-4 w-4" />
              <span className="hidden xs:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm">
              <Palette className="h-4 w-4" />
              <span className="hidden xs:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="creator" className="gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm">
              <Music className="h-4 w-4" />
              <span className="hidden xs:inline">Creator</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {/* Avatar Section */}
            <div className="space-y-4">
              <Label>Profile Photo</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border overflow-hidden flex items-center justify-center text-2xl font-bold">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "?"
                    )}
                  </div>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarSelect(e.target.files?.[0] || null)}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Will be cropped to a circle
                  </p>
                </div>
              </div>
            </div>

            {/* Avatar Cropper Dialog */}
            {tempAvatarFile && (
              <AvatarCropper
                imageFile={tempAvatarFile}
                onCropComplete={handleAvatarCropComplete}
                onCancel={handleAvatarCropCancel}
                open={showAvatarCropper}
              />
            )}

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

            {/* Banner Section */}
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <Label className="text-base font-medium">Profile Banner</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Add a banner image to your profile. Will be cropped to 1200×300px (4:1 ratio).
              </p>
              
              {bannerPreview && (
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={bannerPreview} 
                    alt="Banner preview" 
                    className="w-full h-32 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleBannerSelect(e.target.files?.[0] || null)}
              />
            </div>

            {/* Banner Cropper Dialog */}
            {tempBannerFile && (
              <BannerCropper
                imageFile={tempBannerFile}
                onCropComplete={handleBannerCropComplete}
                onCancel={handleBannerCropCancel}
                open={showBannerCropper}
              />
            )}

            <Button onClick={handleSaveProfile} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Profile
            </Button>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-1">Theme</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred color scheme
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === "light" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Sun className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Light</span>
                </button>
                
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === "dark" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Moon className="h-6 w-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">Dark</span>
                </button>
                
                <button
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === "system" 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="h-6 w-6 mx-auto mb-2 flex items-center justify-center">
                    <Sun className="h-4 w-4 absolute" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                    <Moon className="h-4 w-4 absolute" style={{ clipPath: 'inset(0 0 0 50%)' }} />
                  </div>
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </div>
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

                {/* Social Links Section */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    <Label className="text-base font-medium">Social Links</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add links to your artist profiles. These will be shown on your public profile.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="soundcloud" className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-muted-foreground" />
                        SoundCloud
                      </Label>
                      <Input
                        id="soundcloud"
                        value={soundcloudUrl}
                        onChange={(e) => setSoundcloudUrl(e.target.value)}
                        placeholder="https://soundcloud.com/yourprofile"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="spotify" className="flex items-center gap-2">
                        <Music className="h-4 w-4 text-muted-foreground" />
                        Spotify
                      </Label>
                      <Input
                        id="spotify"
                        value={spotifyUrl}
                        onChange={(e) => setSpotifyUrl(e.target.value)}
                        placeholder="https://open.spotify.com/artist/..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website" className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-muted-foreground" />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/yourprofile"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="youtube" className="flex items-center gap-2">
                        <Youtube className="h-4 w-4 text-muted-foreground" />
                        YouTube
                      </Label>
                      <Input
                        id="youtube"
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {(soundcloudUrl || spotifyUrl || websiteUrl || instagramUrl || youtubeUrl) && (
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                      <SocialLinks
                        soundcloudUrl={soundcloudUrl}
                        spotifyUrl={spotifyUrl}
                        websiteUrl={websiteUrl}
                        instagramUrl={instagramUrl}
                        youtubeUrl={youtubeUrl}
                      />
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveCreator} disabled={saving} className="w-full sm:w-auto">
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
