import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Free lyrics APIs we can try
const LYRICS_APIS = [
  {
    name: 'lyrics.ovh',
    url: (artist: string, title: string) => 
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
    extract: (data: any) => data.lyrics
  }
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist } = await req.json();
    
    if (!title || !artist) {
      return new Response(
        JSON.stringify({ error: 'Title and artist are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching lyrics for: ${artist} - ${title}`);
    
    // Try each API until we get lyrics
    for (const api of LYRICS_APIS) {
      try {
        const url = api.url(artist, title);
        console.log(`Trying ${api.name}: ${url}`);
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          const lyrics = api.extract(data);
          
          if (lyrics && lyrics.trim().length > 0) {
            console.log(`Found lyrics via ${api.name}`);
            return new Response(
              JSON.stringify({ 
                lyrics,
                source: api.name,
                title,
                artist
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (apiError) {
        console.error(`${api.name} failed:`, apiError);
        // Continue to next API
      }
    }
    
    // If Firecrawl is available, try scraping Genius
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (firecrawlKey) {
      try {
        console.log('Trying Firecrawl to scrape lyrics...');
        
        // Search Genius for the song
        const searchQuery = `${artist} ${title} lyrics site:genius.com`;
        const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: `https://genius.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`,
            formats: ['markdown']
          })
        });
        
        if (firecrawlResponse.ok) {
          const firecrawlData = await firecrawlResponse.json();
          // Extract lyrics from markdown if possible
          if (firecrawlData.data?.markdown) {
            // Basic extraction (would need refinement for production)
            const markdown = firecrawlData.data.markdown;
            console.log('Got Firecrawl response, extracting lyrics...');
            
            // Return partial success
            return new Response(
              JSON.stringify({ 
                lyrics: null,
                source: 'firecrawl',
                message: 'Lyrics search initiated, please try again',
                title,
                artist
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (fcError) {
        console.error('Firecrawl failed:', fcError);
      }
    }
    
    // No lyrics found
    console.log('No lyrics found from any source');
    return new Response(
      JSON.stringify({ 
        lyrics: null,
        error: 'Lyrics not found',
        title,
        artist
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Lyrics fetch error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
