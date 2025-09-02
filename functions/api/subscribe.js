export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response("Invalid email", { status: 400 });
    }

    await env.NEWSLETTER_DB.prepare(
      "INSERT OR IGNORE INTO subscribers (email) VALUES (?)"
    )
      .bind(email)
      .run();

    return new Response("Subscribed!", { status: 200 });
  } catch (error) {
    console.error("Subscription error:", error);
    return new Response("Error", { status: 500 });
  }
}