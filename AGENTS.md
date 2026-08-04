# Repository Guidelines

This repository is an automatic Nix binary cache for jcode (upstream
1jehuang/jcode). It contains only the flake, the release workflow, the cache
landing page, and docs. The jcode source is not vendored here: the flake builds
the pinned `jcode-src` input, so there is no Cargo workspace to build.

## Development Workflow

- Commit as you go; push when done.
- After editing `flake.nix` / `flake.lock`, validate with:
  `nix flake update jcode-src` (when inputs change) and
  `nix eval .#packages.x86_64-linux.jcode.drvPath`.
- The only CI is `.github/workflows/nix-tag-release.yml` (daily schedule +
  manual dispatch). Validate workflow changes by running the workflow from the
  Actions tab (workflow_dispatch), or with a manual shell simulation of the
  pin step (sed + `nix flake update jcode-src`).
