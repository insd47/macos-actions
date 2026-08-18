# Import Apple Code-Signing Certificate

Imports a Base64-encoded PKCS12 certificate and private key into an isolated temporary macOS keychain. The action
preserves the existing user keychain search list, restores it in the post step, and removes both the temporary keychain
and certificate file.

The PKCS12 file must contain exactly one code-signing identity. The `identity` output is its SHA-1 hash and can be
passed directly to `codesign --sign`.
