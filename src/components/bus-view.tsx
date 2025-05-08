'use client';

import type { FC } from 'react';
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
// L will be dynamically imported
import 'leaflet/dist/leaflet.css';
import type { LatLngExpression, Icon as LeafletIconType, DivIcon as LeafletDivIconType, PointExpression } from 'leaflet'; // Corrected type imports


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
import { Loader2, MapPin, Navigation, RefreshCw, ListCollapse } from 'lucide-react';

// Dynamically import react-leaflet components
// Only import MapContainer and useMap statically, others are dynamic
import { MapContainer, useMap } from 'react-leaflet';
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });



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
  lat: number;
  lon: number;
}
interface CtaPrediction {
  ty: string; // Type (e.g., "A" for arrival, "D" for departure)
  stpnm: string; // Stop name
  stpid: string; // Stop ID
  vid: string; // Vehicle ID
  rt: string; // Route
  rtdir: string; // Route direction
  des: string; // Destination
  prdtm: string; // Predicted time (YYYYMMDD HH:MM)
  dly: boolean; // Delayed?
  prdctdn: string; // Countdown (minutes or "DUE", "DLY")
}
interface CtaVehicle {
  vid: string;
  tmstmp: string;
  lat: string;
  lon: string;
  hdg: string; // Heading (degrees)
  pid: number;
  rt: string;
  des: string;
  pdist: number;
  dly: boolean;
  spd: number;
  tatripid: string;
  origtatripno: string;
  tablockid: string;
  zone: string;
}

interface UserLocation {
  lat: number;
  lon: number;
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

// --- FitBounds Component for Map ---
interface FitBoundsProps {
  L_instance: typeof import('leaflet'); // Pass L instance
  buses: CtaVehicle[];
  userLocation: UserLocation | null;
  selectedStop: CtaStop | null;
}

const FitBounds: FC<FitBoundsProps> = ({ L_instance, buses, userLocation, selectedStop }) => {
  const map = useMap ? useMap() : null;

  useEffect(() => {
    if (!map || !L_instance) return;

    const points: LatLngExpression[] = [];
    if (userLocation) {
      points.push([userLocation.lat, userLocation.lon]);
    }
    buses.forEach(bus => points.push([parseFloat(bus.lat), parseFloat(bus.lon)]));
    if (selectedStop) {
        points.push([selectedStop.lat, selectedStop.lon]);
    }

    if (points.length > 0) {
      map.fitBounds(L_instance.latLngBounds(points), { padding: [50, 50], maxZoom: 16 });
    } else if (userLocation) {
      // This condition is covered by points.length > 0 and points.length === 1
      // If only userLocation, map.setView will handle it.
      map.setView([userLocation.lat, userLocation.lon], 14);
    } else if (points.length === 0) {
      map.setView([41.8781, -87.6298], 12); // Default Chicago view
    }
  }, [L_instance, buses, userLocation, selectedStop, map]);

  return null;
};

const MapPlaceholder: FC<{ message?: string }> = ({ message = "Loading Map..." }) => (
    <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin mr-2" />
      {message}
    </div>
);


export function BusView() {
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const [userLocationIconInstance, setUserLocationIconInstance] = useState<LeafletIconType | null>(null);
  // The state holds the function that *creates* the icon, not the icon itself, because heading changes.
  const [busArrowIconCreatorFactory, setBusArrowIconCreatorFactory] = useState<(() => (heading: string) => LeafletDivIconType) | null>(null);
  
  const [routes, setRoutes] = useState<CtaRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [directions, setDirections] = useState<CtaDirection[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  const [stops, setStops] = useState<CtaStop[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [predictions, setPredictions] = useState<CtaPrediction[]>([]);
  const [vehicles, setVehicles] = useState<CtaVehicle[]>([]);
  
  const [isLoading, setIsLoading] = useState({
    routes: false,
    directions: false,
    stops: false,
    predictions: false,
    vehicles: false,
    leaflet: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState(0); // Key for re-mounting MapContainer

  const selectedStopDetails = useMemo(() => stops.find(s => s.stpid === selectedStopId), [stops, selectedStopId]);

  useEffect(() => {
    setIsLoading(prev => ({ ...prev, leaflet: true }));
    if (typeof window !== 'undefined') {
      import('leaflet').then(leafletModule => {
        const LInstance = leafletModule.default || leafletModule;
        setL(LInstance);

        setUserLocationIconInstance(new LInstance.Icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        }));
        
        setBusArrowIconCreatorFactory(() => () => (heading: string) => { // Note the double function for the factory
          const numericHeading = parseInt(heading, 10);
          return new LInstance.DivIcon({
            className: 'bg-transparent border-none',
            html: `<div style="transform: rotate(${numericHeading}deg); font-size: 24px; color: hsl(var(--primary));">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                   </div>`,
            iconSize: [24, 24] as PointExpression, 
            iconAnchor: [12, 12] as PointExpression,
          });
        });
        setIsLoading(prev => ({ ...prev, leaflet: false }));
      }).catch(err => {
        console.error("Failed to load Leaflet:", err);
        setError("Map components could not be loaded.");
        setIsLoading(prev => ({ ...prev, leaflet: false }));
      });
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            });
          },
          () => { 
            setUserLocation({ lat: 41.8781, lon: -87.6298 }); 
            console.warn("Geolocation permission denied or error. Using default location.");
          }
        );
    } else {
        setUserLocation({ lat: 41.8781, lon: -87.6298 });
        console.warn("Geolocation not supported by this browser. Using default location.");
    }
  }, []);

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
      setVehicles([]);
      setMapInstanceKey(prev => prev + 1); // Force map re-mount
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
    setVehicles([]);
    setMapInstanceKey(prev => prev + 1); // Force map re-mount
  }, [selectedRoute]);

  useEffect(() => {
    if (!selectedRoute || !selectedDirection) {
      setStops([]);
      setVehicles([]); 
      setSelectedStopId('');
      setPredictions([]);
      setMapInstanceKey(prev => prev + 1); // Force map re-mount
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

    const fetchVehicles = async () => {
      setIsLoading(prev => ({ ...prev, vehicles: true }));
      setError(null);
      try {
        const res = await fetch(`/api/bus?action=vehicles&rt=${selectedRoute}`);
        if (!res.ok) throw new Error(`Failed to fetch vehicles: ${res.statusText}`);
        const data = await res.json();
        const filteredVehicles = (data.vehicle || []).filter((v: CtaVehicle) => 
            v.rtdir && selectedDirection && v.rtdir.toLowerCase().startsWith(selectedDirection.toLowerCase().substring(0,Math.min(3, selectedDirection.length)))
        );
        setVehicles(filteredVehicles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load vehicles.');
        setVehicles([]);
      }
      setIsLoading(prev => ({ ...prev, vehicles: false }));
    };

    fetchStops();
    fetchVehicles();
    setSelectedStopId('');
    setPredictions([]);
    setMapInstanceKey(prev => prev + 1); // Force map re-mount
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
    setMapInstanceKey(prev => prev + 1); // Force map re-mount when stop changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStopId]); 

  const resetForm = () => {
    setSelectedRoute('');
    setMapInstanceKey(prev => prev + 1); // Force map re-mount on reset
    // Other states will be reset by chained useEffects.
  };

  const defaultMapCenter: LatLngExpression = userLocation 
    ? [userLocation.lat, userLocation.lon] 
    : [41.8781, -87.6298]; 

  const mapReady = !!L && !!userLocationIconInstance && !!busArrowIconCreatorFactory && !isLoading.leaflet;
  const actualBusArrowIconCreator = busArrowIconCreatorFactory ? busArrowIconCreatorFactory() : null;


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
                <SelectValue placeholder={isLoading.routes ? "Loading routes..." : "Select a route"} />
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
                disabled={isLoading.directions || directions.length === 0}
              >
                <SelectTrigger id="direction-select">
                  <SelectValue placeholder={isLoading.directions ? "Loading directions..." : "Select a direction"} />
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
                disabled={isLoading.stops || stops.length === 0}
              >
                <SelectTrigger id="stop-select">
                  <SelectValue placeholder={isLoading.stops ? "Loading stops..." : "Select a stop"} />
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

      {selectedRoute && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><MapPin className="h-5 w-5 mr-2"/>Live Bus Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div key={mapInstanceKey} className="w-full h-[400px]">
              {(!mapReady || !actualBusArrowIconCreator) ? (
                <MapPlaceholder
                  message={isLoading.leaflet 
                    ? "Initializing Map Components..." 
                    : "Loading Map..."} 
                />
              ) : (
                <MapContainer
                  center={defaultMapCenter}
                  zoom={13}
                  scrollWheelZoom={true}
                  className="h-full w-full rounded-md z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {vehicles.map(bus => (
                    <Marker
                      key={bus.vid}
                      position={[parseFloat(bus.lat), parseFloat(bus.lon)]}
                      icon={actualBusArrowIconCreator(bus.hdg)}
                    >
                      <Popup>
                        Bus {bus.vid}<br />
                        Route: {bus.rt} to {bus.des}<br/>
                        Speed: {bus.spd} mph {bus.dly ? "(Delayed)" : ""}
                      </Popup>
                    </Marker>
                  ))}

                  {userLocation && userLocationIconInstance && (
                    <Marker
                      position={[userLocation.lat, userLocation.lon]}
                      icon={userLocationIconInstance}
                    >
                      <Popup>Your Location</Popup>
                    </Marker>
                  )}

                  {selectedStopDetails && L && (
                    <Marker 
                      position={[selectedStopDetails.lat, selectedStopDetails.lon]} 
                      icon={L.divIcon({ 
                        className: 'custom-stop-marker-icon', 
                        html: `<div class="p-1 bg-accent text-accent-foreground rounded-full shadow-md text-xs whitespace-nowrap text-center">${selectedStopDetails.stpnm}</div>`,
                      })}
                    >
                      <Popup>{selectedStopDetails.stpnm}</Popup>
                    </Marker>
                  )}

                  {L && (
                    <FitBounds
                      L_instance={L}
                      buses={vehicles}
                      userLocation={userLocation}
                      selectedStop={selectedStopDetails}
                    />
                  )}
                </MapContainer>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
