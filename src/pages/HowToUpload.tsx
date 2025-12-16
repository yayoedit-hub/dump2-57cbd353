import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, FileArchive, Music, Folder, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const HowToUpload = () => {
  return (
    <Layout>
      <div className="container max-w-3xl py-12">
        <Link to="/creator/upload">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Upload
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">How to Upload a Dump Pack</h1>
        <p className="text-muted-foreground mb-8">
          Everything you need to know about preparing and uploading your packs.
        </p>

        <div className="space-y-6">
          {/* Preferred Format */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileArchive className="h-5 w-5" />
                Preferred Format: FL Studio Zipped Project
                <Badge variant="default" className="ml-2">Recommended</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                The best way to share your projects is using FL Studio's built-in export feature:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>In FL Studio, go to <strong className="text-foreground">File → Export → Zipped loop package</strong></li>
                <li>This creates a .zip file containing your .flp and all samples</li>
                <li>Upload this .zip as your "Project File"</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                This ensures subscribers can open your project without missing samples.
              </p>
            </CardContent>
          </Card>

          {/* Preview Requirement */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Preview Audio (Required)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                Every pack needs a preview so subscribers can hear what they're getting:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Length:</strong> 30–90 seconds</li>
                <li><strong className="text-foreground">Format:</strong> MP3 or WAV</li>
                <li><strong className="text-foreground">Content:</strong> Best section of your track or a quick mixdown</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Previews are publicly streamable — they help attract subscribers.
              </p>
            </CardContent>
          </Card>

          {/* Optional Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Optional: Stems & MIDI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>
                For "Compatible Packs," you can include additional files:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Stems (.zip):</strong> Individual audio tracks (drums, bass, melody, etc.)</li>
                <li><strong className="text-foreground">MIDI (.zip):</strong> MIDI files for melodies, chords, drums</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                These help users who don't have FL Studio or want to remix in other DAWs.
              </p>
            </CardContent>
          </Card>

          {/* Pack Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Pack Types Explained
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">FLP Only</h4>
                <p className="text-sm text-muted-foreground">
                  Just the .flp file. Best for projects using only stock FL plugins and samples.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Zipped Project</h4>
                <p className="text-sm text-muted-foreground">
                  FL Studio's zipped export with .flp + all samples. The preferred format.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Compatible Pack</h4>
                <p className="text-sm text-muted-foreground">
                  Zipped project plus stems and/or MIDI. Works for users on any DAW — they can use 
                  the stems even without FL Studio.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Naming Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Suggested Naming</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Help subscribers find and organize your packs:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong className="text-foreground">Title:</strong> Descriptive name (e.g., "Dark Trap Loop 140 BPM")</li>
                <li><strong className="text-foreground">Tags:</strong> Genre, mood, instruments used</li>
                <li><strong className="text-foreground">BPM & Key:</strong> Always include if known</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Good metadata helps your packs get discovered and used.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link to="/creator/upload">
            <Button size="lg">Start Uploading</Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default HowToUpload;
