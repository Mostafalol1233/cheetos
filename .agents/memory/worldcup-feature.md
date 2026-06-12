---
name: World Cup prediction feature
description: World Cup 2026 match score prediction system with admin management
---

## Files created
- `server/routes.ts` — worldcup routes added at bottom before createServer()
- `client/src/pages/world-cup.tsx` — user-facing page at /world-cup
- `client/src/components/admin-worldcup-panel.tsx` — admin panel component
- `client/public/images/worldcup-hero-bg.png` — background image (generated)
- `client/public/images/worldcup-trophy.png` — trophy image (generated, bg removed)

## DB tables
- worldcup_matches — matches with teams, flags, dates, scores, status
- worldcup_predictions — user predictions (unique per user+match)
- worldcup_settings — page config (title, subtitle, video_url, prize_description)

## Key behaviors
- One prediction per user per match (UPDATE on conflict)
- Predictions are private (admin sees all, user sees only own)
- Admin manually marks winners and contacts via WhatsApp button
- WhatsApp button opens wa.me with Arabic congratulations message
- API sync available if FOOTBALL_DATA_API_KEY env var is set (football-data.org, competition WC)
- is_correct auto-updated when admin sets match status=finished with scores
