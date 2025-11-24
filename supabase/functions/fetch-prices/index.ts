import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const source = url.searchParams.get("source");

    let data;

    if (source === "brsapi") {
      const apiKey = url.searchParams.get("apiKey");
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: "API key required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const brsResponse = await fetch(
        `https://brsapi.ir/Api/Market/Gold_Currency.php?key=${apiKey}`
      );
      data = await brsResponse.json();
    } else if (source === "nobitex") {
      const nobitexResponse = await fetch(
        "https://api.nobitex.ir/market/stats"
      );
      data = await nobitexResponse.json();
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid source" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch prices", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
