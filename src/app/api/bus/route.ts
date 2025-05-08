
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CTA_BASE_URL = "http://www.ctabustracker.com/bustime/api/v2";

interface CtaError {
  msg: string;
  [key: string]: string; // Allow other error fields
}

interface CtaVehicle {
  vid: string;       // Vehicle ID
  tmstmp: string;    // Timestamp (YYYYMMDD HH:MM)
  lat: string;       // Latitude
  lon: string;       // Longitude
  hdg: string;       // Heading (e.g., "Northbound", "Southbound")
  pid: number;       // Pattern ID
  rt: string;        // Route designator
  des: string;       // Destination
  pdist: number;     // Distance along pattern
  dly: boolean;      // Delayed?
  spd: number;       // Speed in MPH
  tatripid: string;  // Trip ID being tracked
  origtatripno: string;// Original trip number
  tablockid: string; // Block ID
  zone: string;       // Zone (if any)
}

interface CtaBusTimeResponse {
  vehicle?: CtaVehicle[];
  error?: CtaError[];
}

interface ApiResponse {
  "bustime-response": CtaBusTimeResponse;
}

export async function GET(request: NextRequest) {
  const CTA_BUS_API_KEY = process.env.CTA_BUS_API_KEY;

  if (!CTA_BUS_API_KEY) {
    console.error("CTA_BUS_API_KEY is not defined in environment variables.");
    return NextResponse.json({ message: "API key configuration error." }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const routeId = searchParams.get('rt');
  const direction = searchParams.get('dir');

  if (!routeId) {
    return NextResponse.json({ message: "Missing 'rt' (route ID) query parameter." }, { status: 400 });
  }
  if (!direction) {
    return NextResponse.json({ message: "Missing 'dir' (direction) query parameter." }, { status: 400 });
  }

  const apiUrl = `${CTA_BASE_URL}/getvehicles?key=${CTA_BUS_API_KEY}&format=json&rt=${routeId}`;

  try {
    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      console.error(`CTA API request failed with status: ${apiResponse.status}`, await apiResponse.text());
      return NextResponse.json({ message: `Error fetching data from CTA API: ${apiResponse.statusText}` }, { status: apiResponse.status });
    }

    const data = (await apiResponse.json()) as ApiResponse;

    if (data["bustime-response"]?.error) {
      console.warn("CTA API returned an error:", data["bustime-response"].error);
      return NextResponse.json({ message: "Error from CTA API.", errors: data["bustime-response"].error }, { status: 400 });
    }

    const vehicles = data["bustime-response"]?.vehicle || [];
    
    const filteredVehicles = vehicles.filter(vehicle => 
      vehicle.hdg && vehicle.hdg.toLowerCase() === direction.toLowerCase()
    );

    return NextResponse.json(filteredVehicles);

  } catch (error) {
    console.error("Error processing CTA API request:", error);
    if (error instanceof Error) {
        return NextResponse.json({ message: "An unexpected error occurred.", error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "An unexpected error occurred." }, { status: 500 });
  }
}
