# macOS Actions

A focused collection of GitHub Actions for preparing, signing, and notarizing macOS app bundles.

| Action                | Purpose                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `certificate`         | Imports a PKCS12 certificate into an isolated keychain for the current run. |
| `icon`                | Replaces the `.icns` file referenced by the app's `CFBundleIconFile`.       |
| [`profile`](profile/) | Prepares one downloaded provisioning profile and removes it after the job.  |
| `sign`                | Signs, notarizes, staples, and validates the app bundle.                    |

## Usage

```yaml
- name: Replace app icon
  uses: insd47/macos-actions/icon@v1
  with:
    app-path: build/MyGame.app
    icon-path: MyGame.icns

- name: Import certificate
  id: certificate
  uses: insd47/macos-actions/certificate@v1
  with:
    apple-certificate: ${{ secrets.APPLE_CERTIFICATE }}
    apple-certificate-password: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}

- name: Sign and notarize
  uses: insd47/macos-actions/sign@v1
  env:
    APPLE_ID: ${{ secrets.APPLE_ID }}
    APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
    APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
  with:
    app-path: build/MyGame.app
    identity: ${{ steps.certificate.outputs.identity }}
```

All actions require a macOS runner. The `certificate` and `profile` actions use the GitHub Actions Node.js 24 runtime.

The `icon` action currently supports verified `.icns` replacement only. Support for Icon Composer `.icon` projects or
precompiled `Assets.car` files will be added when it can be tested against real assets and a pinned Xcode toolchain.

## Development

```bash
cd certificate
corepack enable
pnpm install
pnpm check
pnpm build
```

## License

[MIT](LICENSE)
