# Aaron Alderman — personal expedition

A portable, static publication for aaronalderman.com. Aaron leads the identity; Worldwright is credited as the supporting platform. The complete forty-stop expedition, source snapshots and browser workshop live in `dist/`.

GitHub Pages publishes `dist/` through `.github/workflows/pages.yml`. No build service, API, Sites credentials or server is required. `node --test reading.test.mjs publication.test.mjs` checks the portable publication. The broader retained tests additionally use the surrounding research checkout. `node serve.mjs` previews it locally.

Initial publication is at the repository’s GitHub Pages URL. Connect aaronalderman.com after its DNS points to GitHub Pages; a CNAME file will then pin that domain. Do not copy `.openai/hosting.json` from the separate private preview.

Starting edition: private preview source commit 278c28e81723d80d972a1c92ce14dda2c943c394. Personal branding is presentation only; original research and personal-account text are retained.
