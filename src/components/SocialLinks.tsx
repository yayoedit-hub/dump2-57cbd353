import { Button } from "@/components/ui/button";
import { Music2, Globe, Instagram, Youtube } from "lucide-react";

// Custom Spotify icon since lucide doesn't have one
const SpotifyIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

// Custom SoundCloud icon
const SoundCloudIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.9 1.025c-.057 0-.094.046-.094.1l-.164 1.125.164 1.125c0 .057.037.1.094.1.057 0 .1-.043.1-.1l.19-1.125-.19-1.125c0-.057-.043-.1-.1-.1zm1.8-.625c-.057 0-.1.04-.106.094l-.217 1.75.217 1.694c.006.054.05.094.106.094.057 0 .1-.04.106-.094l.254-1.694-.254-1.75c-.006-.054-.05-.094-.106-.094zm.9-.282c-.062 0-.106.044-.112.1l-.191 2.032.19 1.942c.007.057.05.1.113.1.062 0 .106-.043.112-.1l.224-1.942-.224-2.032c-.006-.056-.05-.1-.112-.1zm.9-.18c-.068 0-.118.05-.118.112l-.163 2.212.163 2.012c0 .062.05.112.118.112.069 0 .119-.05.119-.112l.19-2.012-.19-2.212c0-.062-.05-.112-.119-.112zm.9-.125c-.074 0-.125.05-.131.118l-.131 2.337.131 2.094c.006.068.057.118.131.118.074 0 .125-.05.131-.118l.156-2.094-.156-2.337c-.006-.068-.057-.118-.131-.118zm.9.05c-.08 0-.131.056-.137.125l-.1 2.162.1 2.137c.006.075.057.125.137.125.08 0 .132-.05.138-.125l.118-2.137-.118-2.162c-.006-.075-.058-.125-.138-.125zm.9-.175c-.087 0-.143.062-.15.137l-.068 2.287.068 2.175c.007.08.063.137.15.137.087 0 .144-.057.15-.137l.082-2.175-.082-2.287c-.006-.08-.063-.137-.15-.137zm.9.112c-.093 0-.15.068-.156.15l-.044 2.175.044 2.2c.006.087.063.15.156.15.093 0 .15-.063.156-.15l.05-2.2-.05-2.175c-.006-.082-.063-.15-.156-.15zm1.044-.012c-.1 0-.163.068-.169.156l-.025 2.187.025 2.225c.006.087.069.156.169.156.1 0 .162-.069.169-.156l.031-2.225-.031-2.187c-.007-.088-.069-.156-.169-.156zm.9.037c-.106 0-.168.075-.175.163l-.006 2.15.006 2.238c.007.093.069.162.175.162.106 0 .169-.069.175-.162l.006-2.238-.006-2.15c-.006-.088-.069-.163-.175-.163zm2.063-.587c-.412 0-.806.062-1.175.187-.244-2.737-2.569-4.875-5.4-4.875-.706 0-1.381.125-2.006.344-.238.087-.3.175-.306.35v9.562c.006.175.137.319.306.338h8.581c1.656 0 3-1.344 3-3s-1.344-2.906-3-2.906z"/>
  </svg>
);

interface SocialLinksProps {
  soundcloudUrl?: string | null;
  spotifyUrl?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  className?: string;
}

export function SocialLinks({
  soundcloudUrl,
  spotifyUrl,
  websiteUrl,
  instagramUrl,
  youtubeUrl,
  className = ""
}: SocialLinksProps) {
  const hasLinks = soundcloudUrl || spotifyUrl || websiteUrl || instagramUrl || youtubeUrl;
  
  if (!hasLinks) return null;
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {soundcloudUrl && (
        <a href={soundcloudUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <SoundCloudIcon className="h-4 w-4" />
            SoundCloud
          </Button>
        </a>
      )}
      {spotifyUrl && (
        <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <SpotifyIcon className="h-4 w-4" />
            Spotify
          </Button>
        </a>
      )}
      {websiteUrl && (
        <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            Website
          </Button>
        </a>
      )}
      {instagramUrl && (
        <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Instagram className="h-4 w-4" />
            Instagram
          </Button>
        </a>
      )}
      {youtubeUrl && (
        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="gap-2">
            <Youtube className="h-4 w-4" />
            YouTube
          </Button>
        </a>
      )}
    </div>
  );
}
