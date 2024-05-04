import { Hono } from "hono";
import { OpenAI } from "openai";

type Bindings = {
  MATTERMOST_ORIGIN: string;
  MATTERMOST_TOKEN: string;
  OPENAI_API_KEY: string;
};

/** 過去のスレッドをいくつまでコンテキストに含めるか */
const MAX_CONTEXT_SIZE = 7;

const app = new Hono<{ Bindings: Bindings }>()
  .post("/command", async (c) => {
    const command = await c.req.formData();
    console.log(command);

    request(c.env, command.get("response_url") + "", "POST", {
      text: "考えています…",
    });

    const input = command.get("text");
    const quoted =
      input &&
      typeof input === "string" &&
      input
        .split(/\n\n/g)
        .map((line) => `> ${line}`)
        .join("\n\n");

    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: input + "",
        },
      ],
    });
    const message = completion.choices[0].message.content;

    return c.json({
      response_type: "in_channel",
      text: [
        quoted,
        `> from @${command.get("user_name")}`,
        "", //　引用を終えるための空行
        message,
      ].join("\n"),
    });
  })
  .post("/bot", async (c) => {
    const command = await c.req.json();
    console.log(command);

    const botName = command.trigger_word;

    const bot = await request(c.env, `/api/v4/users/me`, "GET").then((res) =>
      res.json()
    );
    const botUserId = bot.id;

    const thread = await request(
      c.env,
      `/api/v4/posts/${command.post_id}/thread`,
      "GET"
    ).then((res) => res.json());
    const posts = Object.values(thread.posts)
      .sort((a, b) => a.create_at - b.create_at)
      .slice(-MAX_CONTEXT_SIZE);
    const root = posts[1]?.root_id ?? command.post_id;

    request(c.env, `/api/v4/posts/users/${bot.id}/typing`, "POST", {
      channel_id: command.channel_id,
      parent_id: root,
    });

    const messages = posts.map((post) => ({
      role: post.user_id === botUserId ? "assistant" : "user",
      content: post.message,
    }));
    console.log(messages);

    const openai = new OpenAI({ apiKey: c.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant called ${botName}.`,
        },
        ...messages,
      ],
    });
    const message = completion.choices[0].message.content;

    await request(c.env, `/api/v4/posts`, "POST", {
      channel_id: command.channel_id,
      root_id: root,
      message: message,
    });

    return c.text("OK");
  });

export default app;

async function request(
  env: Bindings,
  url: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
) {
  const response = await fetch(new URL(url, env.MATTERMOST_ORIGIN), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MATTERMOST_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response;
}
