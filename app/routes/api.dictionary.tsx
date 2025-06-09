import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const word = url.searchParams.get("word");

  if (!word) {
    return json({ error: "Word parameter is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`http://tratu.soha.vn/dict/vn_vn/${encodeURIComponent(word)}`);
    const html = await response.text();
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error fetching dictionary result:", error);
    return json({ error: "Failed to fetch dictionary result" }, { status: 500 });
  }
}; 