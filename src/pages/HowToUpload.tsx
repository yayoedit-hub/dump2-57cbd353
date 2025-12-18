import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, LogIn, Folder, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const HowToUpload = () => {
  return (
    <Layout>
      <div className="container max-w-3xl py-12">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-3xl font-bold mb-2">How to Upload with Dump App</h1>
        <p className="text-muted-foreground mb-8">
          Uploading happens through the Dump desktop app. Here's how to get started.
        </p>

        <div className="space-y-6">
          {/* Step 1 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <Download className="h-5 w-5" />
                Download & Install
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Get the Dump App for your platform:
              </p>
              <div className="flex gap-3">
                <Link to="/download">
                  <Button variant="outline">Download for Windows</Button>
                </Link>
                <Link to="/download">
                  <Button variant="outline">Download for macOS</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <LogIn className="h-5 w-5" />
                Sign In
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Open the app and sign in with <strong className="text-foreground">the same account</strong> you use on this website.
                This links your uploads to your creator profile.
              </p>
            </CardContent>
          </Card>

          {/* Step 3 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <Folder className="h-5 w-5" />
                Create Dump Folder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Click <strong className="text-foreground">"Create Dump folder"</strong> in the app.
                This creates a special folder on your computer where you'll save your FL Studio exports.
              </p>
            </CardContent>
          </Card>

          {/* Step 4 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <Upload className="h-5 w-5" />
                Export Your Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                In FL Studio, export your project to the Dump folder:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Go to <strong className="text-foreground">File → Export → Zipped loop package</strong></li>
                <li>Save to your Dump folder</li>
                <li>Optionally render a preview audio (30-90 seconds)</li>
              </ol>
              <Badge variant="secondary" className="mt-2">Recommended: Zipped loop package includes all samples</Badge>
            </CardContent>
          </Card>

          {/* Step 5 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  5
                </div>
                <CheckCircle className="h-5 w-5" />
                Auto-Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The app automatically detects new files and uploads them. Your pack will appear on your profile within seconds.
                You can edit metadata (title, tags, BPM) from the website after upload.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <p className="text-sm text-muted-foreground">
            If you have questions about uploading, check our FAQ or reach out on Discord.
          </p>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link to="/download">
            <Button size="lg" className="gap-2">
              <Download className="h-4 w-4" />
              Get Dump App
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="lg" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default HowToUpload;
