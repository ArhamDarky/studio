import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // In a real application, you would fetch data from the CTA Train Tracker API
  // For now, returning placeholder data
  const placeholderTrainData = {
    message: "Train API endpoint - placeholder data",
    lines: [
      { id: "Red", name: "Red Line", status: "Good Service" },
      { id: "Blue", name: "Blue Line", status: "Minor Delays" },
    ],
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(placeholderTrainData);
}
