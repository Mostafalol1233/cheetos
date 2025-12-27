# Catbox.moe Image Handling

## API Endpoints
- POST /api/admin/images/catbox-url
  - Body: { url: string, type: 'game'|'category', id: string, filename?: string }
  - Validates Catbox URL (HEAD check), stores metadata in image_assets, updates target record image/image_url.
  - Response: { id, url, updated }

- POST /api/admin/images/migrate-to-catbox
  - Migrates non-Catbox images for games and categories using Catbox URL upload API.
  - Response: { ok, games, categories, updated, errors }

## Metadata Storage
- Table: image_assets
  - id, url, original_filename, source='catbox', related_type, related_id, uploaded_at

## Admin UI
- Tab: Catbox Image Upload
  - Form to paste Catbox URL, select Game/Category and target item.
  - Preview and submit; shows applied URL.

## Usage Guidelines
- Prefer Catbox URLs: https://files.catbox.moe/<hash>.<ext>
- For existing local images, run migration: npm run migrate:catbox
  - Ensure BACKEND_URL is set so local /uploads are accessible for URL upload.

## Troubleshooting
- Invalid URL submissions: endpoint returns 400 with details and logs seller_alerts.
- Failed image processing: migration reports errors; re-run or inspect network.
- Network issues: verify server can reach catbox.moe; check firewall and proxies.

