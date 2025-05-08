import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrainFront } from 'lucide-react';

export function TrainView() {
  return (
    <div className="train-view-container p-4 border border-border rounded-lg bg-card shadow-sm">
      <div className="flex items-center mb-4">
        <TrainFront className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-xl font-semibold text-card-foreground">Real-time Train Tracker</h2>
      </div>
      <p className="text-muted-foreground mb-4">
        Live train positions, line statuses, and station alerts.
      </p>
      <div className="map-placeholder aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center text-muted-foreground">
        <Image
          src="https://picsum.photos/seed/trainmap/600/400"
          alt="Train Map Placeholder"
          width={600}
          height={400}
          className="object-cover w-full h-full"
          data-ai-hint="transit map"
        />
      </div>
      <div className="mt-4 space-y-2">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Red Line</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <CardDescription>Status: Good Service. Next train to Howard: 3 min.</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Blue Line</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <CardDescription>Status: Minor Delays. Next train to O'Hare: 7 min.</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
