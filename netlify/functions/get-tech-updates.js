const fetch = require("node-fetch");

let cache = {
  data: null,
  timestamp: 0
};

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

exports.handler = async (event) => {
  const page = parseInt(event.queryStringParameters?.page || "1");
  const pageSize = 20;

  // Serve from cache
  if (cache.data && Date.now() - cache.timestamp < CACHE_TTL) {
    return buildResponse(cache.data, page, pageSize);
  }

  const apiCalls = [
    fetchNewsAPI(),
    fetchGNews(),
    fetchDevTo(),
    fetchReddit(),
    fetchHackerNews()
  ];

  const results = await Promise.allSettled(apiCalls);

  let items = [];

  results.forEach(r => {
    if (r.status === "fulfilled") {
      items.push(...r.value);
    }
  });

  // Sort newest first
  items.sort((a, b) =>
    new Date(b.publishedAt) - new Date(a.publishedAt)
  );

  // Cap to 1000
  items = items.slice(0, 1000);

  cache = { data: items, timestamp: Date.now() };

  return buildResponse(items, page, pageSize);
};

/* ---------------- Helpers ---------------- */

function buildResponse(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    statusCode: 200,
    body: JSON.stringify({
      total: items.length,
      page,
      pageSize,
      items: paged
    })
  };
}

async function fetchDevTo() {
  const res = await fetch("https://dev.to/api/articles?tag=technology");
  const data = await res.json();

  return data.map(a => ({
    id: `devto-${a.id}`,
    title: a.title,
    description: a.description,
    imageUrl: a.cover_image,
    url: a.url,
    publisher: "Dev.to",
    publishedAt: a.published_at,
    tags: a.tag_list,
    source: "dev.to"
  }));
}
