import { SITE_CONFIG } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-muted">
          © {new Date().getFullYear()} {SITE_CONFIG.name}
        </div>
        <div className="text-xs font-mono text-subtle">
          Built with Next.js. No frameworks were harmed in the making of this site.
        </div>
      </div>
    </footer>
  );
}
