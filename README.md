# tailored-times

Rebuild of [tailored-times.com](https://tailored-times.com): custom newspaper keepsakes. Next.js 16 app in `web/`, Supabase back end.

- Plan and task list: [UPGRADE.md](UPGRADE.md)
- Working notes for AI assistants: [CLAUDE.md](CLAUDE.md)

## Run it locally

```
cd web
npm install
cp .env.example .env.local   # then fill in the Supabase keys
npm run dev                  # http://localhost:3000
```

Database setup: run `web/supabase/setup.sql` once in the Supabase SQL editor.

## Fonts (not in this repo)

The site uses two commercial fonts that are licensed, not free to share, so they are not committed:
`web/public/fonts/Blenda-Script.ttf` and `web/public/fonts/BauhausRegular.ttf`. Copy them into that folder
from the owner's licensed copies. Without them the site still builds and uses free lookalikes
(Lobster for Blenda Script, Comfortaa for Bauhaus).
