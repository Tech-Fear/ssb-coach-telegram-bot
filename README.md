# SSB Telegram Coach

Standalone Node.js project for a Telegram SSB preparation bot deployed on Vercel with Neon storage.

## What This Project Does

- Sends a daily pack to registered chats
- Prevents repeats for a chat once an item has already been sent
- Supports practice mode with scoring, missing points, and a better answer
- Works in private chats and groups

## Commands

- `/start`
- `/help`
- `/registerdaily`
- `/unregisterdaily`
- `/sendtoday`
- `/practice vocab`
- `/practice wat`
- `/practice tat`
- `/practice srt`
- `/practice ppdt`
- `/skip`

## Setup

1. Create a Telegram bot with BotFather.
2. Create a free Neon database.
3. Push this folder to its own GitHub repo.
4. Import the repo into Vercel.
5. Add the environment variables from `.env.example`.
6. Open:

```text
https://your-project.vercel.app/api/setup?secret=YOUR_ADMIN_SECRET
```

That call creates the tables, sets the webhook, and registers commands.

## Environment Variables

- `BOT_TOKEN`
- `DATABASE_URL`
- `WEBHOOK_BASE_URL`
- `CRON_SECRET`
- `ADMIN_SECRET`
- `TELEGRAM_WEBHOOK_SECRET`

## Scheduling Note

The bundled cron is `30 1 * * *`, which targets around `07:00 IST` because Vercel cron runs in UTC. On Vercel Hobby, cron jobs run once per day with hourly precision. Sources: [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs), [Vercel Cron pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing).

## Content Note

This project includes a starter content bank in [content.js](/G:/proj/PingPilot/ssb-telegram-vercel/lib/content.js). The bot will not repeat an already delivered item for a chat, so once a pool is exhausted it will stop and ask for more content instead of repeating old material.

## Files

- `api/telegram.js` webhook
- `api/cron/daily.js` daily sender
- `api/setup.js` setup route
- `lib/db.js` Neon storage
- `lib/content.js` seed bank
- `lib/daily.js` daily pack logic
- `lib/practice.js` practice and evaluation logic
