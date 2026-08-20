# Prepare Apple Provisioning Profile

Selects exactly one profile from the `profiles` output of
[`Apple-Actions/download-provisioning-profiles`](https://github.com/Apple-Actions/download-provisioning-profiles),
moves it to the requested path, and removes both the prepared file and downloaded files in the post step.

```yaml
- name: Download provisioning profiles
  id: profiles
  uses: Apple-Actions/download-provisioning-profiles@v6
  with:
    bundle-id: org.example.app
    profile-type: MAC_APP_DIRECT
    issuer-id: ${{ secrets.APPLE_API_ISSUER }}
    api-key-id: ${{ secrets.APPLE_API_KEY }}
    api-private-key: ${{ secrets.APPLE_API_PRIVATE_KEY }}

- name: Prepare provisioning profile
  uses: insd47/macos-actions/profile@v1
  with:
    profiles: ${{ steps.profiles.outputs.profiles }}
    profile-type: MAC_APP_DIRECT
    destination: src-tauri/embedded.provisionprofile
```

The destination must not already exist. Cleanup runs at the end of the job, including when a later step fails.
