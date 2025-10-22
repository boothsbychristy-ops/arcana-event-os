import { Bug, Shield, Lock, Eye } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left side - Security badges */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              <span>Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              <span>GDPR Compliant</span>
            </div>
          </div>

          {/* Center - Copyright */}
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Arcana. All rights reserved.
          </div>

          {/* Right side - Report a bug */}
          <a
            href="mailto:support@arcana.events?subject=Bug Report - Arcana"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-report-bug"
          >
            <Bug className="h-3 w-3" />
            <span>Report a bug</span>
          </a>
        </div>
      </div>
    </footer>
  );
}