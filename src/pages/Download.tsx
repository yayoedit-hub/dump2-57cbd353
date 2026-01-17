import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Download, Monitor, Apple, Info } from "lucide-react";

// Direct download URLs from public bucket
const WINDOWS_DOWNLOAD_URL =
  "https://pigkjkuteodszjkarwvz.supabase.co/storage/v1/object/public/app-downloads/Dump-Windows-1.0.4-Setup.exe";
const MAC_DOWNLOAD_URL =
  "https://pigkjkuteodszjkarwvz.supabase.co/storage/v1/object/public/app-downloads/Dump-Mac-1.0.4-Installer.dmg";

// Helps verify which deployment is being served (useful during domain/CDN migrations)
const BUILD_ID = "2026-01-17-01";

export default function DownloadPage() {
  return (
    <Layout>
      <div className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-8">
            <Download className="h-10 w-10" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Dump Desktop App</h1>
          <p className="text-lg text-muted-foreground">
            Upload your dump packs directly from FL Studio. The desktop app handles all uploads with proper file organization.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">Build: {BUILD_ID}</p>

          <div className="mt-9 grid sm:grid-cols-2 gap-4 mb-12">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-auto py-6 flex-col gap-2"
              asChild
            >
              <a href={WINDOWS_DOWNLOAD_URL} download>
                <Monitor className="h-8 w-8" />
                <span className="text-lg font-semibold">Download for Windows</span>
                <span className="text-sm text-muted-foreground">Windows 10 or later</span>
              </a>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full h-auto py-6 flex-col gap-2"
              asChild
            >
              <a href={MAC_DOWNLOAD_URL} download>
                <Apple className="h-8 w-8" />
                <span className="text-lg font-semibold">Download for macOS</span>
                <span className="text-sm text-muted-foreground">macOS 11 or later</span>
              </a>
            </Button>
          </div>

          <div className="p-6 rounded-xl bg-secondary/50 text-left">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Why use the desktop app?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Uploads happen only through the Dump app for proper file handling</li>
                  <li>• Automatically organizes your FL Studio projects</li>
                  <li>• Generates previews and extracts metadata</li>
                  <li>• Batch upload multiple dump packs at once</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
