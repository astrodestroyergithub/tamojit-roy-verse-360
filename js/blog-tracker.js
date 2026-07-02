(async () => {

  let sessionId =
    localStorage.getItem('blog_session');

  if (!sessionId) {

    sessionId =
      crypto.randomUUID();

    localStorage.setItem(
      'blog_session',
      sessionId
    );
  }

  const path =
    window.location.pathname;

  const match =
    path.match(/blog(\d+)/i);

  if (!match) return;

  const blogNumber =
    parseInt(match[1], 10);

  const payload = {

    blogNumber,

    sessionId,

    screenResolution:
      `${screen.width}x${screen.height}`,

    viewportSize:
      `${window.innerWidth}x${window.innerHeight}`,

    timezone:
      Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone,

    language:
      navigator.language,

    cookiesEnabled:
      navigator.cookieEnabled,

    touchEnabled:
      navigator.maxTouchPoints > 0,

    colorDepth:
      screen.colorDepth,

    hardwareConcurrency:
      navigator.hardwareConcurrency,

    deviceMemory:
      navigator.deviceMemory || null,

    networkType:
      navigator.connection?.effectiveType || null,

    pageLoadTime:
      Math.round(performance.now())
  };

  fetch(
    '/.netlify/functions/log-blog-visit',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

})();
