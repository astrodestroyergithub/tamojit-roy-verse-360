const fetch = global.fetch;
// const fetch = require("node-fetch");

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

async function fetchNewsAPI() {
  if (!process.env.NEWSAPI_KEY) return [];

  const url = `https://newsapi.org/v2/everything?q=technology&language=en&pageSize=100&apiKey=${process.env.NEWSAPI_KEY}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.articles) return [];

  return json.articles.map((a, i) => ({
    id: `newsapi-${i}`,
    title: a.title,
    description: a.description,
    imageUrl: a.urlToImage,
    url: a.url,
    publisher: a.source?.name || "NewsAPI",
    publishedAt: a.publishedAt,
    tags: ["technology"],
    source: "newsapi"
  }));
}

async function fetchGNews() {
  if (!process.env.GNEWS_KEY) return [];

  const url = `https://gnews.io/api/v4/search?q=technology&lang=en&max=100&token=${process.env.GNEWS_KEY}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json.articles) return [];

  return json.articles.map((a, i) => ({
    id: `gnews-${i}`,
    title: a.title,
    description: a.description,
    imageUrl: a.image,
    url: a.url,
    publisher: a.source?.name || "GNews",
    publishedAt: a.publishedAt,
    tags: ["technology"],
    source: "gnews"
  }));
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

async function fetchReddit() {
  const res = await fetch("https://www.reddit.com/r/technology.json?limit=100");
  const json = await res.json();

  if (!json.data?.children) return [];

  return json.data.children.map(p => ({
    id: `reddit-${p.data.id}`,
    title: p.data.title,
    description: p.data.selftext?.slice(0, 200),
    imageUrl: p.data.thumbnail?.startsWith("http") ? p.data.thumbnail : null,
    url: `https://reddit.com${p.data.permalink}`,
    publisher: "Reddit / r/technology",
    publishedAt: new Date(p.data.created_utc * 1000).toISOString(),
    tags: p.data.link_flair_text ? [p.data.link_flair_text] : [],
    source: "reddit"
  }));
}

async function fetchHackerNews() {
  const topRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
  const ids = await topRes.json();

  const top20 = ids.slice(0, 20);

  const stories = await Promise.allSettled(
    top20.map(id =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then(r => r.json())
    )
  );

  return stories
    .filter(s => s.status === "fulfilled" && s.value)
    .map(s => ({
      id: `hn-${s.value.id}`,
      title: s.value.title,
      description: null,
      imageUrl: null,
      url: s.value.url || `https://news.ycombinator.com/item?id=${s.value.id}`,
      publisher: "Hacker News",
      publishedAt: new Date(s.value.time * 1000).toISOString(),
      tags: ["technology"],
      source: "hackernews"
    }));
}
