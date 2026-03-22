# Image Asset Update & Seeding: Operational Guide

## Objectives
- Update all database image records atomically with strict normalization.
- Seed images automatically on deployment with validation, logging, and monitoring.
- Verify cross-browser rendering and ensure persistence across restarts.

## Database Update Procedure
- Secure DB connection initializes through backend/db.js with IPv4 preference and SSL detection.
- Transaction updates all image fields in games and categories using normalize rules:
  - Keep external http/https.
  - Map bare filenames to /images if present; otherwise /media.
  - Fix legacy absolute uploads to /uploads.
  - Preserve Catbox links.
- Atomic commit rolls back on error; results recorded in seeding_runs and admin_audit_logs; failures logged to seller_alerts.

## Backend Seeding Process
- Startup calls:
  - initializeDatabase
  - seedGamesFromJsonIfEmpty (one-time fallback)
  - seedProductImages when ENABLE_IMAGE_SEEDING=true
  - runImageAssetsSeeding (always executes)
- Validation checks:
  - Counts of updated rows and errors stored in seeding_runs.
  - Admin audit record created for each run.
  - Seller alert created on failure.
- Logging:
  - Console output and DB admin_audit_logs summarize operations.

## Quality Assurance
- Frontend:
  - ImageWithFallback renders images immediately with lazy loading and SVG fallback.
  - Games page uses ImageWithFallback; popular and category pages inherit normalization.
- Tests:
  - Playwright suite validates image visibility, aspect ratio, fallback behavior.
  - Manual check:
    - /api/games returns normalized image URLs.
    - Direct asset checks under /images and /media.
- Persistence:
  - DB updates stored; survives server restarts.

## Monitoring
- Alerts:
  - seller_alerts entry with type=seeding_error on failure.
- Reports:
  - GET /api/admin/seeding/status returns latest run summary.
  - GET /api/admin/seeding/report returns recent run list and totals.

## Security & Consistency
- JWT-protected admin endpoints for status/reporting.
- Single transaction for updates across tables ensures consistency.
- Safe SSL handling for cloud databases; IPv4 preference for stability.

## Environment Flags
- ENABLE_IMAGE_SEEDING=true enables public image seeding to products.
- DISABLE_MAINTENANCE_SCRIPTS=true skips maintenance scripts auto-run.

## Troubleshooting
- Verify DATABASE_URL and connectivity.
- Check seeding_runs and seller_alerts for diagnostics.
- Inspect console logs on backend startup for summary and errors.

