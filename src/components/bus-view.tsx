
'use client';

import type { FC } from 'react';
import { useEffect, useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, RefreshCw, ListCollapse } from 'lucide-react';

// --- Interfaces for API Responses ---
interface CtaRoute {
  rt: string;
  rtnm: string;
  rtclr: string; // color of route, e.g. "#FF0000"
  rtdd: string; // route designator, e.g. "Red Line"
}
interface CtaDirection {
  dir: string;
}
interface CtaStop {
  stpid: string;
  stpnm: string;
  // lat and lon were removed as map features are currently disabled
}
interface CtaPrediction {
  ty: string; // type, e.g. "A" for arrival
  stpnm: string; // stop name
  stpid: string; // stop id
  vid: string; // vehicle id
  rt: string; // route
  rtdir: string; // route direction
  des: string; // destination
  prdtm: string; // prediction time, e.g. "20230315 14:30"
  dly: boolean; // delayed
  prdctdn: string; // prediction countdown, e.g. "5 MIN" or "DUE"
}
// CtaVehicle interface removed as map features are currently disabled

// --- Helper Functions ---
const formatPredictionTime = (timestamp: string): string => {
  if (!timestamp || !timestamp.includes(' ')) return "N/A";
  const [_datePart, timePart] = timestamp.split(' ');
  const [hour, minute] = timePart.split(':');
  let h = parseInt(hour, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const formattedHour = h % 12 === 0 ? 12 : h % 12;
  return `${formattedHour}:${minute} ${suffix}`;
};


export function BusView() {
  const [routes, setRoutes] = useState<CtaRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [directions, setDirections] = useState<CtaDirection[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  const [stops, setStops] = useState<CtaStop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [predictions, setPredictions] = useState<CtaPrediction[]>([]);
  // vehicles state removed as map features are currently disabled
  
  const [isLoading, setIsLoading] = useState({
    routes: false,
    directions: false,
    stops: false,
    predictions: false,
    // vehicles: false, // Part of map features, removed
  });
  const [error, setError] = useState<string | null>(null);

  const selectedStopDetails = useMemo(() => stops.find(s => s.stpid === selectedStopId), [stops, selectedStopId]);


  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(prev => ({ ...prev, routes: true }));
      setError(null);
      try {
        const res = await fetch('/api/bus?action=routes');
        if (!res.ok) throw new Error(`Failed to fetch routes: ${res.statusText}`);
        const data = await res.json();
        setRoutes(data.routes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load routes.');
        setRoutes([]);
      }
      setIsLoading(prev => ({ ...prev, routes: false }));
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (!selectedRoute) {
      setDirections([]);
      setSelectedDirection('');
      setStops([]);
      setSelectedStopId('');
      setPredictions([]);
      // setVehicles([]); // Part of map features, removed
      return;
    }
    const fetchDirections = async () => {
      setIsLoading(prev => ({ ...prev, directions: true }));
      setError(null);
      try {
        const res = await fetch(`/api/bus?action=directions&rt=${selectedRoute}`);
        if (!res.ok) throw new Error(`Failed to fetch directions: ${res.statusText}`);
        const data = await res.json();
        setDirections(data.directions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load directions.');
        setDirections([]);
      }
      setIsLoading(prev => ({ ...prev, directions: false }));
    };
    fetchDirections();
    setStops([]);
    setSelectedStopId('');
    setPredictions([]);
    // setVehicles([]); // Part of map features, removed
  }, [selectedRoute]);

  useEffect(() => {
    if (!selectedRoute || !selectedDirection) {
      setStops([]);
      // setVehicles([]); // Part of map features, removed
      setSelectedStopId('');
      setPredictions([]);
      return;
    }
    const fetchStops = async () => {
      setIsLoading(prev => ({ ...prev, stops: true }));
      setError(null);
      try {
        const res = await fetch(`/api/bus?action=stops&rt=${selectedRoute}&dir=${encodeURIComponent(selectedDirection)}`);
        if (!res.ok) throw new Error(`Failed to fetch stops: ${res.statusText}`);
        const data = await res.json();
        setStops(data.stops || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stops.');
        setStops([]);
      }
      setIsLoading(prev => ({ ...prev, stops: false }));
    };

    // fetchVehicles call removed as map features are currently disabled

    fetchStops();
    // fetchVehicles(); // Part of map features, removed
    setSelectedStopId('');
    setPredictions([]);
  }, [selectedRoute, selectedDirection]);

  const handleFetchPredictions = async () => {
    if (!selectedRoute || !selectedStopId) return;
    setIsLoading(prev => ({ ...prev, predictions: true }));
    setError(null);
    try {
      const res = await fetch(`/api/bus?action=predictions&rt=${selectedRoute}&stpid=${selectedStopId}`);
      if (!res.ok) throw new Error(`Failed to fetch predictions: ${res.statusText}`);
      const data = await res.json();
      setPredictions(data.prd || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions.');
      setPredictions([]);
    }
    setIsLoading(prev => ({ ...prev, predictions: false }));
  };
  
  useEffect(() => {
    if (selectedStopId) { 
        handleFetchPredictions();
    } else {
        setPredictions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStopId]); 

  const resetForm = () => {
    setSelectedRoute('');
    // Other states will be reset by chained useEffects.
    // No need to reset isLoading here, as it's managed by fetch operations.
    setError(null);
  };

  return (
    <div className="space-y-6 p-1">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bus Selection</span>
            <Button variant="ghost" size="icon" onClick={resetForm} aria-label="Reset selections">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="route-select">Route</Label>
            <Select value={selectedRoute} onValueChange={setSelectedRoute} disabled={isLoading.routes}>
              <SelectTrigger id="route-select">
                <SelectValue placeholder={isLoading.routes ? "Loading routes..." : (routes.length === 0 ? "No routes available" : "Select a route")} />
              </SelectTrigger>
              <SelectContent>
                {routes.map(route => (
                  <SelectItem key={route.rt} value={route.rt}>
                    {route.rt} - {route.rtnm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoute && (
            <div>
              <Label htmlFor="direction-select">Direction</Label>
              <Select 
                value={selectedDirection} 
                onValueChange={setSelectedDirection} 
                disabled={isLoading.directions} // Changed: disable only while loading
              >
                <SelectTrigger id="direction-select">
                  <SelectValue placeholder={isLoading.directions ? "Loading directions..." : (directions.length === 0 && !isLoading.directions ? "No directions available" : "Select a direction")} />
                </SelectTrigger>
                <SelectContent>
                  {directions.map(dir => (
                    <SelectItem key={dir.dir} value={dir.dir}>
                      {dir.dir}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedDirection && (
            <div>
              <Label htmlFor="stop-select">Stop</Label>
              <Select 
                value={selectedStopId} 
                onValueChange={setSelectedStopId} 
                disabled={isLoading.stops} // Changed: disable only while loading
              >
                <SelectTrigger id="stop-select">
                  <SelectValue placeholder={isLoading.stops ? "Loading stops..." : (stops.length === 0 && !isLoading.stops ? "No stops available" : "Select a stop")} />
                </SelectTrigger>
                <SelectContent>
                  {stops.map(stop => (
                    <SelectItem key={stop.stpid} value={stop.stpid}>
                      {stop.stpnm} ({stop.stpid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading.predictions && (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading predictions...
        </div>
      )}

      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
                <ListCollapse className="h-5 w-5 mr-2"/> Upcoming Buses at {selectedStopDetails?.stpnm || 'Selected Stop'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {predictions.map((p, i) => (
                <li key={`${p.vid}-${p.prdtm}-${i}`} className="text-sm p-2 border rounded-md">
                  Route <strong>{p.rt}</strong> towards <strong>{p.des}</strong> ({p.rtdir})
                  <br/>Arriving at <strong>{formatPredictionTime(p.prdtm)}</strong> (countdown: {p.prdctdn})
                  {p.dly && <span className="ml-2 px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded-full">Delayed</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {selectedStopId && !isLoading.predictions && predictions.length === 0 && (
         <Card>
            <CardContent className="pt-6">
                <p className="text-muted-foreground">No bus predictions available for this stop at the moment.</p>
            </CardContent>
         </Card>
      )}

      {/* Map and vehicle list sections are removed as per previous request */}

    </div>
  );
}
