# Mattermost GPT

Tools for Mattermost that uses the OpenAI's [GPT-4o](https://platform.openai.com/docs/models/gpt-4o) model to generate text based on the input.

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
