import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import logoDark from "@/assets/logo-dark.png";
import logoLight from "@/assets/logo-light.png";

export function Footer() {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === "dark" ? logoLight : logoDark;

  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="dump.media" className="h-6 w-auto" />
              <span className="text-xl font-bold tracking-tight">dump.media</span>
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              Subscribe to producers' unfinished projects. For all DAWs.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explore" className="hover:text-foreground transition-colors">Explore</Link></li>
              <li><Link to="/download" className="hover:text-foreground transition-colors">Download App</Link></li>
              <li><Link to="/auth" className="hover:text-foreground transition-colors">Sign Up</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/how-to-upload" className="hover:text-foreground transition-colors">How to Upload</Link></li>
              <li><Link to="/licensing" className="hover:text-foreground transition-colors">Licensing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              <li><Link to="/licensing" className="hover:text-foreground transition-colors">Licensing</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} dump.media. All rights reserved.</p>
          <p>Made for producers, by producers.</p>
        </div>
      </div>
    </footer>
  );
}
