# jcode · Nix binary cache

[![jcode version](https://img.shields.io/badge/jcode-v0.68.0-blue)](https://github.com/1jehuang/jcode/releases)

This repository is an **automatic Nix binary cache** for
[jcode](https://github.com/1jehuang/jcode), the blazing-fast TUI coding agent
with multi-model and swarm coordination. It does not vendor the jcode source: a
[Nix flake](flake.nix) wraps the latest upstream release tag and CI turns it
into prebuilt, signed binaries that other Nix/NixOS projects install without
compiling.

## How it works

- `flake.nix` pins the latest upstream release through the `jcode-src` input;
  `flake.lock` locks the exact commit.
- The version badge at the top of this README is refreshed by the same CI run
  that pins a new upstream tag, so it always shows the jcode release this
  cache serves.
- `.github/workflows/nix-tag-release.yml` runs daily (and on demand): it
  resolves the newest `vX.Y.Z` tag upstream, re-pins the flake, builds
  `.#jcode` (plus its crane `cargoArtifacts` dependency layer), and publishes:
  - a signed Nix binary cache on GitHub Pages (`gh-pages` branch, served at
    https://grigio.github.io/jcode), and
  - a release tarball under the `nix-vX.Y.Z` release.
- After a successful build the workflow commits the refreshed pin back to the
  default branch, so the flake input and the cache never drift: downstream
  installs substitute from the cache instead of compiling from source.

## Install (flake)

Step-by-step install guide (binary cache setup, project/NixOS usage, upgrade
and self-update gotcha): [docs/install-nix.md](docs/install-nix.md).

Run once without installing:

```bash
nix run github:grigio/jcode
```

Install into your profile (downloads the prebuilt closure from the cache once
it is configured below):

```bash
nix profile install github:grigio/jcode
```

Or build it and run the binary directly:

```bash
nix build github:grigio/jcode
./result/bin/jcode
```

On NixOS, add the flake as an input and put
`inputs.jcode.packages.${pkgs.system}.default` in `environment.systemPackages`:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    jcode.url = "github:grigio/jcode";
  };

  outputs = { nixpkgs, ... }@inputs: {
    nixosConfigurations.my-machine = nixpkgs.lib.nixosSystem {
      specialArgs = { inherit inputs; };
      modules = [
        ({ pkgs, ... }: {
          environment.systemPackages = [ inputs.jcode.packages.${pkgs.system}.default ];
        })
      ];
    };
  };
}
```

## Binary cache

Configure the substituter and the cache's trust key once, then
`nix profile install github:grigio/jcode` (and `nixos-rebuild`) download the
prebuilt jcode closure instead of building it:

```bash
mkdir -p ~/.config/nix
cat >> ~/.config/nix/nix.conf <<'EOF'
extra-substituters = https://grigio.github.io/jcode
extra-trusted-public-keys = grigio-jcode:WdqguwKdwOilH+ITvLO98qZy9x5HQ8Cl0xltHtSsUvQ=
EOF
```

The cache publishes both the `jcode` binary and its crane `cargoArtifacts`
dependency layer (the `jcode-deps-<version>` store path). That layer is a
build input of `jcode`, so a cache that only had the binary would still force
Nix to compile every crate dependency from source; publishing it makes
installs a pure download with zero compilation.

The dependency layer is hundreds of MB compressed, so its nar files are hosted
as GitHub Release assets (under the matching `nix-vX.Y.Z` release) rather than
on the Pages site; the narinfos on the Pages site point at those URLs, so Nix
substitutes them transparently.

On NixOS, use the equivalent `nix.settings` options:

```nix
nix.settings = {
  substituters = [ "https://grigio.github.io/jcode" ];
  trusted-public-keys = [ "grigio-jcode:WdqguwKdwOilH+ITvLO98qZy9x5HQ8Cl0xltHtSsUvQ=" ];
};
```

Paths the cache does not have fall back to building from source.

## Release tarballs

Each upstream release also publishes a stripped, gzip-compressed binary under
the matching `nix-vX.Y.Z` release tag (extracts to
`jcode-nix-linux-x86_64.bin`):

```bash
curl -fsSL "https://github.com/grigio/jcode/releases/download/nix-<version>/jcode-nix-linux-x86_64.tar.gz" | tar xz
```

> **Note:** the tarball is built in Nix CI, so its dynamic loader is pinned to
> the CI's store paths and it only runs on machines that already have the same
> Nix closure. Installing via the flake is the reliable path; the tarball is for
> inspection and Nix environments that share the closure.

## Repo setup (one-time)

The cache steps are skipped until two things are configured:
(1) enable GitHub Pages on the `gh-pages` branch (Settings -> Pages ->
"Deploy from a branch"), and (2) add the cache's secret signing key as the
`NIX_CACHE_PRIVATE_KEY` Actions secret. The public key above is the trust
anchor; the matching secret key must stay private.
