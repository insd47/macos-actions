# Sign and Notarize macOS App

Signs an `.app` with an imported identity and the hardened runtime option, submits it to Apple's notary service with
`notarytool`, staples the ticket, and runs a Gatekeeper assessment. An optional entitlements plist can be supplied.
