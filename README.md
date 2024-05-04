# Mattermost GPT

Tools for Mattermost that uses OpenAI's GPT-4 Turbo to generate text based on the input.

## Usage

```
/gpt <text>
```

or

```
@chatgpt <text>
```

Trigger words are configurable in the Mattermost settings (admin only).

## Development

```
npm install
npm run dev
```

Set .dev.vars

```
MATTERMOST_ORIGIN=
MATTERMOST_TOKEN=
OPENAI_API_KEY=
```
