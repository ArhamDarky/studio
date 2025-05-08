import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus } from 'lucide-react';

export function BusView() {
  return (
    <div className="bus-view-container p-4 border border-border rounded-lg bg-card shadow-sm">
      <div className="flex items-center mb-4">
        <Bus className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-xl font-semibold text-card-foreground">Real-time Bus Tracker</h2>
      </div>
      <p className="text-muted-foreground mb-4">
        Current bus locations and estimated arrival times.
      </p>
      <div className="map-placeholder aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center text-muted-foreground">
        <Image
          src="https://picsum.photos/seed/busmap/600/400"
          alt="Bus Map Placeholder"
          width={600}
          height={400}
          className="object-cover w-full h-full"
          data-ai-hint="city map"
        />
      </div>
      <div className="mt-4 space-y-2">
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Route #22 Clark</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <CardDescription>Next bus: 5 min (Northbound), 12 min (Southbound)</CardDescription>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Route #X9 Ashland Express</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <CardDescription>Next bus: 8 min (Northbound), Delayed (Southbound)</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
