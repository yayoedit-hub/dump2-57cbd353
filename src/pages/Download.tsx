import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Download, Monitor, Apple, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppFile {
  name: string;
  url: string;
}

export default function DownloadPage() {
  const [windowsFile, setWindowsFile] = useState<AppFile | null>(null);
  const [macFile, setMacFile] = useState<AppFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppFiles() {
      try {
        const { data: files, error } = await supabase.storage
          .from('app-downloads')
          .list();

        if (error) {
          console.error('Error fetching app files:', error);
          setLoading(false);
          return;
        }

        // Find Windows installer (.exe)
        const windowsInstaller = files?.find(f => f.name.endsWith('.exe'));
        if (windowsInstaller) {
          const { data: urlData } = supabase.storage
            .from('app-downloads')
            .getPublicUrl(windowsInstaller.name);
          setWindowsFile({ name: windowsInstaller.name, url: urlData.publicUrl });
        }

        // Find macOS installer (.dmg)
        const macInstaller = files?.find(f => f.name.endsWith('.dmg'));
        if (macInstaller) {
          const { data: urlData } = supabase.storage
            .from('app-downloads')
            .getPublicUrl(macInstaller.name);
          setMacFile({ name: macInstaller.name, url: urlData.publicUrl });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAppFiles();
  }, []);

  const handleDownload = (file: AppFile | null, platform: string) => {
    if (file) {
      window.open(file.url, '_blank');
    } else {
      alert(`Coming soon! The ${platform} app is currently in development.`);
    }
  };

  return (
    <Layout>
      <div className="container py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-8">
            <Download className="h-10 w-10" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Dump Desktop App
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            Upload your dump packs directly from FL Studio. The desktop app handles all uploads with proper file organization.
          </p>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-auto py-6 flex-col gap-2"
                onClick={() => handleDownload(windowsFile, 'Windows')}
              >
                <Monitor className="h-8 w-8" />
                <span className="text-lg font-semibold">Download for Windows</span>
                <span className="text-sm text-muted-foreground">
                  {windowsFile ? 'Windows 10 or later' : 'Coming soon'}
                </span>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-auto py-6 flex-col gap-2"
                onClick={() => handleDownload(macFile, 'macOS')}
              >
                <Apple className="h-8 w-8" />
                <span className="text-lg font-semibold">Download for macOS</span>
                <span className="text-sm text-muted-foreground">
                  {macFile ? 'macOS 11 or later' : 'Coming soon'}
                </span>
              </Button>
            </div>
          )}
          
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
