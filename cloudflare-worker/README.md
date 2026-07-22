# Hokhiyoti Newsletter Cloudflare Worker

This Cloudflare Worker handles newsletter subscriptions securely by proxying requests to Brevo (Sendinblue) API.

## Setup

### 1. Install Dependencies

```bash
cd cloudflare-worker
npm install
```

### 2. Set Secrets

Set the Brevo API key as a secret (never commit this):

```bash
npx wrangler secret put BREVO_API_KEY
```

When prompted, enter your Brevo API key.

### 3. Configure List ID

Edit `wrangler.toml` and set your Brevo list ID:

```toml
[vars]
BREVO_LIST_ID = "your_list_id_here"
```

Or set it as a secret:

```bash
npx wrangler secret put BREVO_LIST_ID
```

### 4. Deploy

```bash
npm run deploy
```

### 5. Test Locally

```bash
npm run dev
```

Then test with:

```bash
curl -X POST http://localhost:8787/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## API Endpoint

### POST /newsletter

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success):**
```json
{
  "success": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security

- Brevo API key is stored as a Cloudflare secret, never in code
- Email validation is performed before API call
- CORS enabled for frontend access
- Only POST requests accepted
