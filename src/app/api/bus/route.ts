import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // In a real application, you would fetch data from the CTA Bus Tracker API
  // For now, returning placeholder data
  const placeholderBusData = {
    message: "Bus API endpoint - placeholder data",
    routes: [
      { id: "22", name: "Clark", status: "Good Service" },
      { id: "X9", name: "Ashland Express", status: "Good Service" },
    ],
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(placeholderBusData);
}
