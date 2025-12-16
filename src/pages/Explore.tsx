import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const GENRES = ["Hip Hop", "Trap", "R&B", "Drill", "Pop", "Electronic", "Lo-Fi", "Soul"];
const PRICE_RANGES = [
  { label: "Under $10", min: 0, max: 10 },
  { label: "$10-20", min: 10, max: 20 },
  { label: "$20+", min: 20, max: 1000 },
];

interface Creator {
  id: string;
  handle: string;
  bio: string | null;
  tags: string[];
  banner_url: string | null;
  price_usd: number;
  user_id: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

// Placeholder creators for empty state
const PLACEHOLDER_CREATORS: Creator[] = [
  {
    id: "placeholder-1",
    handle: "beatsmith",
    bio: "LA-based producer dropping unfinished heat weekly. Specializing in hard-hitting trap and melodic hip hop.",
    tags: ["Hip Hop", "Trap"],
    banner_url: null,
    price_usd: 10,
    user_id: "",
    profiles: { display_name: "Beat Smith", avatar_url: null },
  },
  {
    id: "placeholder-2",
    handle: "melodymaven",
    bio: "Grammy-nominated producer sharing the vault. Soul samples, vintage keys, and smooth progressions.",
    tags: ["R&B", "Soul"],
    banner_url: null,
    price_usd: 15,
    user_id: "",
    profiles: { display_name: "Melody Maven", avatar_url: null },
  },
  {
    id: "placeholder-3",
    handle: "808god",
    bio: "Hard-hitting 808s and dark melodies. UK drill and trap instrumentals.",
    tags: ["Drill", "Trap"],
    banner_url: null,
    price_usd: 8,
    user_id: "",
    profiles: { display_name: "808 God", avatar_url: null },
  },
  {
    id: "placeholder-4",
    handle: "lofilegend",
    bio: "Chill beats for studying and relaxing. Vintage samples and dusty drums.",
    tags: ["Lo-Fi", "Hip Hop"],
    banner_url: null,
    price_usd: 5,
    user_id: "",
    profiles: { display_name: "Lo-Fi Legend", avatar_url: null },
  },
  {
    id: "placeholder-5",
    handle: "synthwave_sam",
    bio: "Retro synths and modern production. 80s inspired electronic music.",
    tags: ["Electronic", "Pop"],
    banner_url: null,
    price_usd: 12,
    user_id: "",
    profiles: { display_name: "Synthwave Sam", avatar_url: null },
  },
  {
    id: "placeholder-6",
    handle: "drillmaster",
    bio: "UK drill specialist. Sliding 808s and aggressive patterns.",
    tags: ["Drill", "Hip Hop"],
    banner_url: null,
    price_usd: 10,
    user_id: "",
    profiles: { display_name: "Drill Master", avatar_url: null },
  },
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, [selectedGenres, selectedPriceRange, searchQuery]);

  const fetchCreators = async () => {
    setLoading(true);
    
    let query = supabase
      .from("creators")
      .select(`
        *,
        profiles:user_id (
          display_name,
          avatar_url
        )
      `)
      .eq("is_active", true);

    if (searchQuery) {
      query = query.or(`handle.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`);
    }

    if (selectedPriceRange) {
      query = query
        .gte("price_usd", selectedPriceRange.min)
        .lte("price_usd", selectedPriceRange.max);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching creators:", error);
      setCreators(PLACEHOLDER_CREATORS);
    } else if (data && data.length > 0) {
      let filteredData = data as Creator[];
      
      if (selectedGenres.length > 0) {
        filteredData = filteredData.filter((creator) =>
          creator.tags?.some((tag) => selectedGenres.includes(tag))
        );
      }
      
      setCreators(filteredData.length > 0 ? filteredData : PLACEHOLDER_CREATORS);
    } else {
      setCreators(PLACEHOLDER_CREATORS);
    }
    
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { q: searchQuery } : {});
    fetchCreators();
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedPriceRange(null);
    setSearchQuery("");
    setSearchParams({});
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedPriceRange || searchQuery;

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Explore creators</h1>
          <p className="text-muted-foreground">
            Find producers and subscribe to access their dump libraries
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by name, handle, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </form>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className="md:w-auto"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {selectedGenres.length + (selectedPriceRange ? 1 : 0) + (searchQuery ? 1 : 0)}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="p-6 rounded-xl border border-border bg-card mb-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filters</h3>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                  <X className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selectedGenres.includes(genre)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3">Price Range</h4>
                <div className="flex flex-wrap gap-2">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.label}
                      onClick={() =>
                        setSelectedPriceRange(
                          selectedPriceRange?.min === range.min ? null : range
                        )
                      }
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-secondary"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl border border-border animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-secondary" />
                  <div className="flex-1">
                    <div className="h-5 w-24 bg-secondary rounded mb-2" />
                    <div className="h-4 w-16 bg-secondary rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-secondary rounded mb-2" />
                <div className="h-4 w-2/3 bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {creators.length} creator{creators.length !== 1 ? "s" : ""} found
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {creators.map((creator) => (
                <Link
                  key={creator.id}
                  to={creator.id.startsWith("placeholder") ? "#" : `/creator/${creator.handle}`}
                  className="group block"
                  onClick={(e) => creator.id.startsWith("placeholder") && e.preventDefault()}
                >
                  <article className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold overflow-hidden">
                        {creator.profiles?.avatar_url ? (
                          <img
                            src={creator.profiles.avatar_url}
                            alt={creator.profiles.display_name || creator.handle}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (creator.profiles?.display_name || creator.handle).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                          {creator.profiles?.display_name || creator.handle}
                        </h3>
                        <p className="text-sm text-muted-foreground">@{creator.handle}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">${creator.price_usd}</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {creator.bio || "No bio yet"}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {creator.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-xs font-medium bg-secondary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    {creator.id.startsWith("placeholder") && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center">
                          Sample creator • Sign up to see real profiles
                        </p>
                      </div>
                    )}
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
