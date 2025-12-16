import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { ArrowRight, Music, Download, Sparkles, Play } from "lucide-react";

const FEATURED_CREATORS = [
  {
    id: "1",
    handle: "beatsmith",
    display_name: "Beat Smith",
    avatar_url: null,
    price_usd: 10,
    tags: ["Hip Hop", "Trap"],
    bio: "Producer based in LA. Dropping unfinished heat weekly.",
  },
  {
    id: "2",
    handle: "melodymaven",
    display_name: "Melody Maven",
    avatar_url: null,
    price_usd: 15,
    tags: ["R&B", "Soul"],
    bio: "Grammy-nominated producer sharing the vault.",
  },
  {
    id: "3",
    handle: "808god",
    display_name: "808 God",
    avatar_url: null,
    price_usd: 8,
    tags: ["Drill", "UK Rap"],
    bio: "Hard-hitting 808s and dark melodies.",
  },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(35_100%_50%/0.08),transparent_50%)]" />
        
        <div className="container relative py-24 md:py-32 lg:py-40">
          <div className="max-w-3xl mx-auto text-center stagger-children">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-sm font-medium mb-6">
              <Music className="h-4 w-4" />
              For FL Studio Producers
            </span>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Subscribe to producers'<br />
              <span className="text-muted-foreground">unwanted beats</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Dump Packs: unfinished FL Studio projects, optional stems + MIDI, 
              always with previews. Learn, flip, and finish tracks from your favorite producers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/explore">
                <Button size="xl" variant="hero" className="w-full sm:w-auto">
                  Explore creators
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth?mode=creator">
                <Button size="xl" variant="hero-outline" className="w-full sm:w-auto">
                  Become a creator
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground">Three steps to level up your production game</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto stagger-children">
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                <Music className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Subscribe</h3>
              <p className="text-muted-foreground">
                Find a producer you love and subscribe to access their entire dump library.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Download</h3>
              <p className="text-muted-foreground">
                Get FL Studio projects, stems, and MIDI files from dumps you like.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Create</h3>
              <p className="text-muted-foreground">
                Flip, learn, and finish tracks. Make them your own.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Featured creators</h2>
              <p className="text-muted-foreground">Discover top producers sharing their vault</p>
            </div>
            <Link to="/explore">
              <Button variant="outline">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {FEATURED_CREATORS.map((creator) => (
              <Link 
                key={creator.id} 
                to={`/creator/${creator.handle}`}
                className="group block"
              >
                <article className="p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold">
                      {creator.display_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate group-hover:text-accent transition-colors">
                        {creator.display_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{creator.handle}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">${creator.price_usd}</span>
                      <span className="text-sm text-muted-foreground">/mo</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {creator.bio}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {creator.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2.5 py-1 text-xs font-medium bg-secondary rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to share your vault?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Turn your unfinished projects into recurring revenue. 
            Set your price, upload your dumps, and build your subscriber base.
          </p>
          <Link to="/auth?mode=creator">
            <Button size="xl" variant="secondary" className="font-semibold">
              Start as a creator
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
