// Cloudflare Worker: serves search-engine crawlers and social-share bots a
// fully-rendered Prerender.io snapshot of basepointengineering.com, while
// real visitors keep getting the normal Webflow client-side-rendered page
// untouched. This exists because Webflow is fully hosted with no server
// middleware of its own — the only place bot-vs-human routing logic can run
// in front of it is at the DNS/edge layer.
//
// Deployment (outside this repo): proxy the domain's DNS through Cloudflare,
// bind this Worker to a Route matching basepointengineering.com/*, and set
// the PRERENDER_TOKEN secret via `wrangler secret put PRERENDER_TOKEN`.
//
// Snapshot correctness depends on public/webflow/*.js setting
// window.prerenderReady = true once content/meta/JSON-LD are in the DOM —
// see the readiness contract added to each detail/listing script.

const PRERENDER_SERVICE_URL = "https://service.prerender.io/";

// Keep in sync with Prerender.io's own bot list. Deliberately broader than
// "Googlebot" alone since Bing and social-share unfurlers (Slack/LinkedIn/
// Facebook) also benefit from a rendered snapshot.
const BOT_UA_REGEX =
  /googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|linkedinbot|twitterbot|slackbot|discordbot|whatsapp|telegrambot|applebot|petalbot|semrushbot|ahrefsbot|mj12bot/i;

// Static assets should never be proxied to Prerender.
const IGNORED_EXTENSIONS =
  /\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|woff|woff2|ttf|svg|webp|json)$/i;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const ua = request.headers.get("User-Agent") || "";
    const isBot =
      BOT_UA_REGEX.test(ua) || url.searchParams.has("_escaped_fragment_");
    const isAsset = IGNORED_EXTENSIONS.test(url.pathname);

    if (!isBot || isAsset || request.method !== "GET") {
      // Real visitors and asset requests: pass straight through to Webflow.
      return fetch(request);
    }

    const prerenderUrl = PRERENDER_SERVICE_URL + url.toString();
    const prerenderReq = new Request(prerenderUrl, {
      method: "GET",
      headers: {
        "User-Agent": ua,
        "X-Prerender-Token": env.PRERENDER_TOKEN,
      },
    });

    const prerenderResp = await fetch(prerenderReq);

    if (!prerenderResp.ok) {
      // Fail open: never serve bots a 5xx just because Prerender.io hiccuped.
      return fetch(request);
    }

    const headers = new Headers(prerenderResp.headers);
    headers.set("X-Prerendered-By", "cloudflare-worker");
    return new Response(prerenderResp.body, {
      status: prerenderResp.status,
      headers,
    });
  },
};
