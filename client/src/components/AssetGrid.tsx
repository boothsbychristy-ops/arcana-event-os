import { FileText, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface Asset {
  url: string;
  type: string;
  label?: string;
  addedAt?: string;
}

interface AssetGridProps {
  items: Asset[];
}

export default function AssetGrid({ items }: AssetGridProps) {
  if (!items?.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No assets yet
      </div>
    );
  }

  const isImage = (url: string) => /\.(png|jpg|jpeg|gif|webp)$/i.test(url);
  const isPDF = (url: string) => /\.pdf$/i.test(url);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((asset, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-border bg-card overflow-hidden hover-elevate active-elevate-2"
          data-testid={`card-asset-${idx}`}
        >
          {/* Asset Preview */}
          <div className="aspect-square bg-muted relative">
            {isImage(asset.url) ? (
              <img
                src={asset.url}
                alt={asset.label || 'Asset'}
                className="w-full h-full object-cover"
                data-testid={`img-asset-${idx}`}
              />
            ) : isPDF(asset.url) ? (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="h-16 w-16 text-muted-foreground" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ExternalLink className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Asset Info */}
          <div className="p-3 space-y-1">
            {asset.label && (
              <p className="text-sm font-medium text-foreground truncate" data-testid={`text-asset-label-${idx}`}>
                {asset.label}
              </p>
            )}
            
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground capitalize">
                {asset.type?.replace('_', ' ')}
              </span>
              
              {asset.addedAt && (
                <span className="text-xs text-muted-foreground">
                  {format(new Date(asset.addedAt), 'MMM d')}
                </span>
              )}
            </div>

            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              data-testid={`link-asset-view-${idx}`}
            >
              <ExternalLink className="h-3 w-3" />
              View
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
