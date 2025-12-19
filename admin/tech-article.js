const article = JSON.parse(localStorage.getItem("selectedTechArticle"));

if (article) {
  document.getElementById("articleTitle").innerText = article.title;
  document.getElementById("articleMeta").innerText =
    `${article.publisher} • ${new Date(article.publishedAt).toLocaleString()}`;

  if (article.imageUrl) {
    document.getElementById("articleImage").src = article.imageUrl;
  }

  document.getElementById("articleDescription").innerText =
    article.description || "No description available.";

  document.getElementById("articleSource").href = article.url;
}
