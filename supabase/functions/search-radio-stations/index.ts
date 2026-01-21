import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Radio-browser.info API servers (they rotate, we pick one)
const RADIO_BROWSER_SERVERS = [
  'de1.api.radio-browser.info',
  'nl1.api.radio-browser.info',
  'at1.api.radio-browser.info',
];

async function getWorkingServer(): Promise<string> {
  // Try each server until one works
  for (const server of RADIO_BROWSER_SERVERS) {
    try {
      const response = await fetch(`https://${server}/json/stats`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        console.log(`Using radio-browser server: ${server}`);
        return server;
      }
    } catch {
      console.log(`Server ${server} not responding, trying next...`);
    }
  }
  // Default fallback
  return RADIO_BROWSER_SERVERS[0];
}

interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  country: string;
  countrycode: string;
  language: string;
  tags: string;
  votes: number;
  homepage: string;
  codec: string;
  bitrate: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query') || '';
    // Default to Switzerland if no country specified
    const country = url.searchParams.get('country') || 'Switzerland';
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    // Support ordering by clicks or votes
    const orderBy = url.searchParams.get('order') || 'clickcount';
    
    console.log(`Searching radio stations: query="${query}", country="${country}", limit=${limit}, order=${orderBy}`);

    const server = await getWorkingServer();
    
    // Build search params
    const searchParams = new URLSearchParams();
    if (query) searchParams.append('name', query);
    if (country && country !== 'all') searchParams.append('country', country);
    searchParams.append('limit', limit.toString());
    searchParams.append('offset', offset.toString());
    // Order by clickcount (popularity) for better Swiss station ranking
    searchParams.append('order', orderBy);
    searchParams.append('reverse', 'true');
    searchParams.append('hidebroken', 'true');
    
    // Search by name (includes partial matches)
    const searchUrl = `https://${server}/json/stations/search?${searchParams.toString()}`;
    console.log(`Fetching: ${searchUrl}`);
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'My2Go/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Radio-browser API error: ${response.status}`);
    }

    const stations: RadioStation[] = await response.json();
    
    // Transform to our format
    const results = stations.map(station => ({
      uuid: station.stationuuid,
      name: station.name,
      url: station.url_resolved || station.url,
      favicon: station.favicon || null,
      country: station.country,
      countryCode: station.countrycode,
      language: station.language,
      tags: station.tags ? station.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      votes: station.votes,
      homepage: station.homepage || null,
      codec: station.codec,
      bitrate: station.bitrate,
    }));

    console.log(`Found ${results.length} stations`);

    return new Response(JSON.stringify({ 
      success: true, 
      stations: results,
      count: results.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error searching radio stations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage,
      stations: [],
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});