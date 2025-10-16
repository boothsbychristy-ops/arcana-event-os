import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmbedFrame from '@/components/EmbedFrame';
import BackgroundPicker from '@/components/BackgroundPicker';
import { FileImage, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Approval {
  id: string;
  title: string;
  description: string;
  status: string;
  draftUrl: string | null;
  createdAt: string;
}

export default function Approvals() {
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

  const { data: approvals, isLoading } = useQuery<Approval[]>({
    queryKey: ['/api/approvals'],
  });

  const handleBackgroundSelect = (url: string) => {
    setSelectedBackground(url);
    console.log('Selected background:', url);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle2 },
      feedback: { variant: 'outline', icon: XCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">
          Approvals Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage client approvals, select backgrounds, and collaborate on creative assets
        </p>
      </div>

      {/* Creative Libraries Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileImage className="h-5 w-5 text-primary" />
          Creative Libraries
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmbedFrame
            src="https://pbbackdrops.com/collections/all"
            title="PB Backdrops"
          />
          <EmbedFrame
            src="https://paddee.io"
            title="Paddee Templates"
          />
        </div>
      </div>

      {/* AI Background Picker */}
      <div id="background">
        <h2 className="text-xl font-semibold mb-4">AI Background Generator</h2>
        <BackgroundPicker onSelect={handleBackgroundSelect} />
        {selectedBackground && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selected: <span className="text-foreground font-mono">{selectedBackground}</span>
            </p>
          </div>
        )}
      </div>

      {/* Approvals List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Client Approvals</h2>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading approvals...</div>
        ) : approvals && approvals.length > 0 ? (
          <div className="grid gap-4">
            {approvals.map((approval) => (
              <Card key={approval.id} data-testid={`card-approval-${approval.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{approval.title}</CardTitle>
                      <CardDescription className="mt-1">{approval.description}</CardDescription>
                    </div>
                    {getStatusBadge(approval.status)}
                  </div>
                </CardHeader>
                {approval.draftUrl && (
                  <CardContent>
                    <div className="rounded-lg overflow-hidden border border-border">
                      <img
                        src={approval.draftUrl}
                        alt={approval.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileImage className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No approvals yet. Create your first approval to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
