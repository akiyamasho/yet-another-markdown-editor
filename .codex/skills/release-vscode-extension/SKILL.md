---
name: release-vscode-extension
description: Release a new version of this repository's VS Code extension when the user authorizes packaging, GitHub release, push, or Marketplace publication.
---

# Release VS Code Extension

Use this skill for an authorized release of Yet Another Markdown Editor. The skill is discoverable automatically, but it never grants permission for external mutations: obtain explicit authorization in the current request immediately before committing, pushing, creating a GitHub release, or uploading to the Marketplace.

## Preflight

- Read the repository `AGENTS.md` and inspect `git status --short` and the current branch. Stop if unrelated dirty changes are present; do not reset, stash, or overwrite them.
- Determine the target version from the user's request, or choose the appropriate next semantic version for the release scope (routine fixes normally use a patch increment). Check it against the current `package.json` version and stop on a collision with an existing tag, GitHub release, or Marketplace version. Do not silently choose a different version.
- Keep `package.json` and `package-lock.json` at the target version, with a matching `CHANGELOG.md` entry. The stable release asset filename is always `yet-another-markdown-editor.vsix`, which the README latest-download URL must continue to reference. Its internal manifest/version, Git tag, GitHub release, and Marketplace version must all match the target version.

## Verify and package

Run the repository's release checks as appropriate, including `npm ci`, `npm test`, `npm run typecheck`, `npm run build`, and `npm run package`. Inspect the generated VSIX contents and manifest before publication; repository-only `.codex/` skill files must remain committed to Git but be excluded by `.vscodeignore`, and inspection must confirm there is no `extension/.codex/**` in the VSIX. Do not commit `dist/`, `node_modules/`, or generated `.vsix` files; retain the VSIX only as the upload artifact if the repository's ignore/release workflow permits it. If a check or packaging step fails, stop and report the failure.

## Publish

Only after explicit current-turn authorization:

1. Review the exact diff and staged file list, then commit the release changes.
2. Create the matching version tag and push the authorized branch/tag. Create the GitHub Release with the matching version and intended notes only if GitHub release authorization was given.
3. Publish to the VS Code Marketplace only if Marketplace upload was explicitly authorized. Use the publisher management page (`https://marketplace.visualstudio.com/manage/publishers/akiyamasho`) and upload the inspected VSIX through the UI. Verify that the publisher page reports the new version.

Never expose tokens, cookies, upload URLs containing credentials, or other secrets in logs or responses. If authorization is missing, stop after local verification and provide the exact artifact and commands/actions still requiring approval. If any remote system reports a collision or mismatch, stop instead of retrying with altered metadata.
