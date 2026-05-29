# PRD Design Brief

Upload or import a PRD, generate a UX design brief, and prepare Figma wireframe data.

## Local Static Preview

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173`.

## Vercel Feishu Integration

The Feishu integration needs a serverless backend because the app secret must not be exposed in browser code.

Set these environment variables in Vercel:

```text
LARK_APP_ID=cli_xxx
LARK_APP_SECRET=xxx
LARK_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/lark/callback
```

Configure the same redirect URI in the Feishu developer console.

Useful endpoints:

- `/api/lark/login` starts Feishu OAuth.
- `/api/lark/callback` stores the user access token in an HTTP-only cookie.
- `/api/lark/session` checks whether the browser is connected.
- `/api/lark-doc?url=...` imports a Feishu PRD.
- `/api/lark-doc/create` creates a Feishu design document from generated Markdown.

## Notes

GitHub Pages can host the static prototype, but it cannot run the Feishu OAuth backend.
