import { Hono } from "hono";
import { OpenAI } from "openai";

type Bindings = {
  MATTERMOST_TOKEN: string;
  OPENAI_API_KEY: string;
};

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
  .post("/bot", (c) => {});

export default app;

async function request(
  env: Bindings,
  url: string,
  method: "GET" | "POST",
  body?: Record<string, unknown>
) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MATTERMOST_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.text();
  return data;
}
