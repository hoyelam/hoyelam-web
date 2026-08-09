# Product feedback system

The site collects anonymous feedback for multiple products and uses each product's private GitHub repository as its ticket tracker.

## Architecture

```text
Product app or website
        ↓
hoyelam.com/feedback/?project=…
        ↓
Cloudflare Turnstile + feedback Worker
        ↓
Cloudflare Workers AI safety classification
        ↓
Allowlisted private GitHub repository
        ↓ add the `public` label after review
Sanitized public Kanban on hoyelam.com
```

No GitHub credential is sent to the browser. Turnstile blocks automated abuse, and the Worker rejects content that Cloudflare's Llama Guard safety model classifies as unsafe before opening an issue. The moderation check fails closed: if it is unavailable, no ticket is created.

New issues are private by default. The public endpoint only returns tickets carrying both `feedback` and `public`, and explicitly excludes GitHub users, contact email, comments, repository URLs, and internal labels.

## Supported products

The shared allowlist is [`feedback/projects.js`](../feedback/projects.js):

| Project ID        | Ticket repository          | Worker token binding   |
| ----------------- | -------------------------- | ---------------------- |
| `loudscript-ios`  | `Kin-yee/LoudScript`        | `GITHUB_TOKEN_KIN_YEE` |
| `loudscript-mac`  | `hoyelam/LoudScript-mac`   | `GITHUB_TOKEN_HOYELAM` |
| `spacepadx`        | `Kin-yee/spacepadx-ios`    | `GITHUB_TOKEN_KIN_YEE` |
| `thinkdrop`        | `Kin-yee/think-drop`       | `GITHUB_TOKEN_KIN_YEE` |
| `websave`          | `Kin-yee/WebSnap-iOS`      | `GITHUB_TOKEN_KIN_YEE` |

Add future products to this allowlist. Never accept a repository name from the form.

## App deep links

Apps should open the feedback page in `SFSafariViewController`, the system browser, or an equivalent in-app browser. The canonical parameters are:

| Parameter      | Values                               | Purpose                                        |
| -------------- | ------------------------------------ | ---------------------------------------------- |
| `project`      | One of the project IDs listed above | Selects the product                            |
| `type`         | `bug`, `idea`                        | Selects the feedback type                      |
| `source`       | Short free-form identifier           | Records where the form was opened              |
| `app_version`  | App version/build                    | Prefills diagnostic context                    |
| `os_version`   | OS version                           | Prefills diagnostic context                    |
| `title`        | Up to 120 characters                 | Optionally prefills a title                    |
| `lock_project` | `1`                                  | Prevents the visitor from changing the product |

Example:

```text
https://hoyelam.com/feedback/?project=loudscript-mac&type=bug&source=loudscript-mac&app_version=1.4.0&os_version=macOS%2026.0&lock_project=1
```

Build URLs with `URLComponents`/`URLQueryItem` instead of string concatenation so values are encoded safely.

## GitHub setup

1. Create fine-grained tokens with `Issues: read and write` for only the listed repositories. Because the repositories currently have two resource owners, use the two bindings in the table above. A GitHub App can replace these tokens later without changing the public API.
2. Export the tokens locally and create/update the required labels:

   ```sh
   GITHUB_TOKEN_HOYELAM=… GITHUB_TOKEN_KIN_YEE=… node worker/scripts/setup-labels.mjs
   ```

3. Review new private issues in GitHub. Add `public` only after checking that the title and Details section contain no private information.
4. Move tickets by replacing their single `status:*` label with `status:review`, `status:planned`, `status:in-progress`, or `status:released`.

Removing `public` hides a ticket after the Worker cache expires, within five minutes.

## Local development

1. Copy `.env.example` to `.env`.
2. Copy `worker/.dev.vars.example` to `worker/.dev.vars` and replace the GitHub tokens.
3. Start the Worker with a localhost origin override:

   ```sh
   npm --prefix worker install
   npm --prefix worker run dev -- --var ALLOWED_ORIGINS:http://localhost:4321
   ```

4. In another terminal, start Astro:

   ```sh
   npm run dev
   ```

The included Turnstile keys are Cloudflare's always-pass local testing keys. Production must use a hostname-restricted production widget.

## Production configuration

Configure these Cloudflare Worker secrets:

```sh
cd worker
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put GITHUB_TOKEN_HOYELAM
npx wrangler secret put GITHUB_TOKEN_KIN_YEE
npx wrangler deploy
```

Configure these GitHub repository variables for the static-site build:

- `PUBLIC_FEEDBACK_API_URL`: deployed Worker origin, without `/v1/tickets`
- `PUBLIC_TURNSTILE_SITE_KEY`: public Turnstile widget site key

Configure these GitHub Actions secrets for automated Worker deployment:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Worker secrets persist across normal deployments and are not stored in this repository.

The Workers AI binding is declared in `worker/wrangler.jsonc`; it does not require another secret. Cloudflare bills its model usage separately, including remote model calls made during local Worker development.

## Verification

```sh
npm run build
npm --prefix worker test
```

Test deep links for each canonical project ID and at least one alias. Verify that an issue without `public` never appears, and that a published issue never returns its contact email or GitHub author.
