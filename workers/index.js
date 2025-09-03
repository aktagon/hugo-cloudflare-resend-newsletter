export default {
  async fetch(request, env, ctx) {
    return new Response("Newsletter Worker is running", { status: 200 });
  },

  async scheduled(event, env, ctx) {
    try {
      // Get RSS feed
      const rss = await fetch(`${env.NEWSLETTER_SITE_URL}/index.xml`);
      const rssText = await rss.text();

      // Parse recent posts (last 7 days)
      const posts = parseRecentPosts(rssText);
      if (posts.length === 0) return;

      // Get subscribers
      const subscribers = await env.NEWSLETTER_DB.prepare(
        "SELECT email, unsubscribe_token FROM subscribers WHERE active = TRUE"
      ).all();

      // Send emails
      for (const sub of subscribers.results) {
        const htmlWithUnsubscribe = await generateHTML(posts, env.NEWSLETTER_WEEKLY_COMMENTARY, sub.unsubscribe_token, env.NEWSLETTER_SITE_URL, env);
        await sendEmail(env, sub.email, htmlWithUnsubscribe, posts);
      }

      console.log(`Newsletter sent to ${subscribers.results.length} subscribers`);
    } catch (error) {
      console.error("Newsletter failed:", error);
    }
  },
};

function parseRecentPosts(rssText) {
  const posts = [];
  const items = rssText.match(/<item>(.*?)<\/item>/gs) || [];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const item of items) {
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1];
    const link = item.match(/<link>(.*?)<\/link>/)?.[1];
    const pubDate = new Date(item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1]);

    if (pubDate > oneWeekAgo && title && link) {
      posts.push({ title, link, pubDate });
    }
  }

  return posts;
}

async function getNewsletterTemplate(env) {
  const response = await env.ASSETS.fetch('/newsletter.html');
  return await response.text();
}

function renderTemplate(template, data) {
  let result = template;
  
  // Handle conditionals with content
  result = result.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, key, content) => {
    return data[key] ? content : '';
  });
  
  // Handle simple variable substitutions
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || '';
  });
  
  return result;
}

async function generateHTML(posts, commentary, unsubscribeToken = null, siteUrl = 'https://signals.aktagon.com', env) {
  const template = await getNewsletterTemplate(env);
  const postsHtml = posts
    .map(p => `    <h3><a href="${p.link}">${p.title}</a></h3>
    <p>Published: ${p.pubDate.toDateString()}</p>`)
    .join('\n');

  const data = {
    commentary,
    posts: postsHtml,
    unsubscribeToken,
    siteUrl
  };

  return renderTemplate(template, data);
}

async function sendEmail(env, email, html, posts) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.NEWSLETTER_FROM_EMAIL,
      to: [email],
      subject: `Weekly Newsletter: ${posts.length} New Posts`,
      html: html,
    }),
  });

  if (!response.ok) {
    console.error(`Failed to send email to ${email}:`, await response.text());
  }
}