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
  rtclr: string; 
  rtdd: string; 
}
interface CtaDirection {
  dir: string;
}
interface CtaStop {
  stpid: string;
  stpnm: string;
}
interface CtaPrediction {
  ty: string; 
  stpnm: string; 
  stpid: string; 
  vid: string; 
  rt: string; 
  rtdir: string; 
  des: string; 
  prdtm: string; 
  dly: boolean; 
  prdctdn: string; 
}

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
  
  const [isLoading, setIsLoading] = useState({
    routes: false,
    directions: false,
    stops: false,
    predictions: false,
  });
  const [error, setError] = useState<string | null>(null);

  const selectedStopDetails = useMemo(() => stops.find(s => s.stpid === selectedStopId), [stops, selectedStopId]);


  useEffect(() => {
    const fetchRoutes = async () => {
      setIsLoading(prev => ({ ...prev, routes: true }));
      setError(null);
      try {
        const res = await fetch('/api/bus?action=routes');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch routes: ${res.statusText}` }));
          throw new Error(errorData.message || `Failed to fetch routes: ${res.statusText}`);
        }
        const data = await res.json();
        if (data && data.routes) {
          setRoutes(data.routes);
        } else if (data && data.errors) { 
          setError(`API Error: ${data.errors.map((e: {msg: string}) => e.msg).join(', ')}`);
          setRoutes([]);
        } else {
          setRoutes([]);
        }
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
      return;
    }
    const fetchDirections = async () => {
      setIsLoading(prev => ({ ...prev, directions: true }));
      setError(null);
      try {
        const res = await fetch(`/api/bus?action=directions&rt=${selectedRoute}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch directions: ${res.statusText}` }));
          throw new Error(errorData.message || `Failed to fetch directions: ${res.statusText}`);
        }
        const data = await res.json();
        if (data && data.directions) {
          setDirections(data.directions);
        } else if (data && data.errors) {
          setError(`API Error: ${data.errors.map((e: {msg: string}) => e.msg).join(', ')}`);
          setDirections([]);
        } else {
          setDirections([]);
        }
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
  }, [selectedRoute]);

  useEffect(() => {
    if (!selectedRoute || !selectedDirection) {
      setStops([]);
      setSelectedStopId('');
      setPredictions([]);
      return;
    }
    const fetchStops = async () => {
      setIsLoading(prev => ({ ...prev, stops: true }));
      setError(null);
      try {
        const res = await fetch(`/api/bus?action=stops&rt=${selectedRoute}&dir=${encodeURIComponent(selectedDirection)}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: `Failed to fetch stops: ${res.statusText}` }));
          throw new Error(errorData.message || `Failed to fetch stops: ${res.statusText}`);
        }
        const data = await res.json();
        if (data && data.stops) {
          setStops(data.stops);
        } else if (data && data.errors) {
          setError(`API Error: ${data.errors.map((e: {msg: string}) => e.msg).join(', ')}`);
          setStops([]);
        } else {
          setStops([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stops.');
        setStops([]);
      }
      setIsLoading(prev => ({ ...prev, stops: false }));
    };

    fetchStops();
    setSelectedStopId('');
    setPredictions([]);
  }, [selectedRoute, selectedDirection]);

  const handleFetchPredictions = async () => {
    if (!selectedRoute || !selectedStopId) return;
    setIsLoading(prev => ({ ...prev, predictions: true }));
    setError(null);
    try {
      const res = await fetch(`/api/bus?action=predictions&rt=${selectedRoute}&stpid=${selectedStopId}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: `Failed to fetch predictions: ${res.statusText}` }));
        throw new Error(errorData.message || `Failed to fetch predictions: ${res.statusText}`);
      }
      const data = await res.json();
      if (data && data.prd) {
        setPredictions(data.prd);
      } else if (data && data.error) { // CTA predictions API uses "error" not "errors"
        setError(`API Error: ${data.error.map((e: {msg: string}) => e.msg).join(', ')}`);
        setPredictions([]);
      }
       else {
        setPredictions([]);
      }
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
    setError(null);
  };

  return (
    <div className="space-y-6 p-1 bus-view-container">
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
            <Select
              value={selectedRoute}
              onValueChange={setSelectedRoute}
              disabled={isLoading.routes}
            >
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

          {selectedRoute && ( // Only show if a route is selected
            <div>
              <Label htmlFor="direction-select">Direction</Label>
              <Select 
                value={selectedDirection} 
                onValueChange={setSelectedDirection} 
                disabled={isLoading.directions || !selectedRoute}
              >
                <SelectTrigger id="direction-select">
                  <SelectValue placeholder={
                      !selectedRoute ? "Select a route first" : // Should not be visible if selectedRoute is false
                      isLoading.directions ? "Loading directions..." :
                      (directions.length === 0 ? "No directions found" : "Select a direction")
                  } />
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

          {selectedDirection && ( // Only show if a direction is selected
            <div>
              <Label htmlFor="stop-select">Stop</Label>
              <Select 
                value={selectedStopId} 
                onValueChange={setSelectedStopId} 
                disabled={isLoading.stops || !selectedDirection}
              >
                <SelectTrigger id="stop-select">
                  <SelectValue placeholder={
                    !selectedDirection ? "Select a direction first" : // Should not be visible
                    isLoading.stops ? "Loading stops..." :
                    (stops.length === 0 ? "No stops found" : "Select a stop")
                  } />
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
                <li key={`${p.vid}-${p.prdtm}-${i}`} className="text-sm p-3 border rounded-md shadow-sm bg-card hover:bg-muted/50 transition-colors">
                  <div className="font-semibold">Route <strong>{p.rt}</strong> to <strong>{p.des}</strong></div>
                  <div className="text-muted-foreground text-xs">Direction: {p.rtdir}</div>
                  <div className="mt-1">
                    Arrival: <strong>{formatPredictionTime(p.prdtm)}</strong> ({p.prdctdn})
                    {p.dly && <span className="ml-2 px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded-full">Delayed</span>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {selectedStopId && !isLoading.predictions && predictions.length === 0 && !error && ( // Added !error condition
         <Card>
            <CardContent className="pt-6">
                <p className="text-muted-foreground">No bus predictions available for this stop at the moment, or the selected route may not service this stop directly.</p>
            </CardContent>
         </Card>
      )}
    </div>
  );
}