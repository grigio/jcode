{
  description = "jcode – blazing-fast TUI coding agent with multi-model and swarm coordination";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    flake-utils.url = "github:numtide/flake-utils";

    crane.url = "github:ipetkov/crane";

    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      crane,
      rust-overlay,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };

        # Stable Rust toolchain with useful extensions for development
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [
            "rust-src"
            "rust-analyzer"
            "rustfmt"
            "clippy"
          ];
        };

        craneLib = (crane.mkLib pkgs).overrideToolchain rustToolchain;

        # Filter source to only what Cargo needs plus compile-time prompt/test fixtures.
        # craneLib.filterCargoSources keeps .rs/.toml/Cargo.lock/.cargo/config and all
        # directories; we additionally keep the non-rs assets embedded via include_str!.
        src = pkgs.lib.cleanSourceWith {
          src = ./.;
          filter =
            path: type:
            let
              base = baseNameOf path;
              relPath = pkgs.lib.removePrefix "${builtins.toString ./.}/" (builtins.toString path);
            in
            # Never pull the git repo or local build artifacts into the Nix store
            !(type == "directory" && (base == ".git" || base == "target"))
            && (
              (craneLib.filterCargoSources path type)
              # include_str!() fixtures used by jcode-base (system/swarm prompts)
              || pkgs.lib.hasPrefix "crates/jcode-base/src/prompt/" relPath
              # include_str!() HTML fixtures used by the websearch tool
              || pkgs.lib.hasPrefix "crates/jcode-app-core/src/tool/testdata/" relPath
              # integration-test fixtures
              || pkgs.lib.hasPrefix "tests/fixtures/" relPath
            );
        };

        # Read version from Cargo.toml for use in build metadata
        cargoToml = builtins.fromTOML (builtins.readFile ./Cargo.toml);

        # Native build inputs (available at compile time)
        nativeBuildInputs =
          with pkgs;
          [
            pkg-config
          ]
          ++ lib.optionals stdenv.isLinux [
            clang # C compiler for vendored C deps (onig_sys)
            mold # fast linker
          ];

        # Runtime / link-time dependencies
        buildInputs =
          with pkgs;
          [
            openssl # native-tls (IMAP/SMTP)
          ]
          ++ lib.optionals stdenv.isLinux [
            libxcb # clipboard support (arboard → xcb)
            libX11 # X11 clipboard fallback
          ]
          ++ lib.optionals stdenv.isDarwin (
            with darwin.apple_sdk.frameworks;
            [
              AppKit # clipboard / GUI on macOS
              Security # TLS / keychain
              SystemConfiguration
            ]
          );

        # Arguments shared between the deps-only build and the full build
        commonArgs = {
          inherit src nativeBuildInputs buildInputs;
          strictDeps = true;

          # Keep peak memory within ~7 GB CI boxes: the largest rustc unit
          # (jcode-base) peaks around 1.6 GiB, so 2 jobs stays safely under.
          CARGO_BUILD_JOBS = "2";

          # Override build.rs git detection so the Nix sandbox build succeeds.
          # The build.rs falls back to these env vars when git is unavailable.
          JCODE_BUILD_GIT_HASH = "nix-build"; # git is unavailable in the Nix sandbox
          JCODE_BUILD_GIT_DATE = "1970-01-01 00:00:00 +0000";
          JCODE_BUILD_GIT_DIRTY = "0";
          JCODE_BUILD_GIT_TAG = "v${cargoToml.package.version}";
          JCODE_RELEASE_BUILD = "1";

          # Tell pkg-config where to find OpenSSL
          OPENSSL_NO_VENDOR = "1";
        };

        # Build only dependencies first (this layer is cached separately by crane)
        cargoArtifacts = craneLib.buildDepsOnly commonArgs;

        # Build the final jcode binary
        jcode = craneLib.buildPackage (
          commonArgs
          // {
            inherit cargoArtifacts;
            # Build only the main binary; skip test_api and jcode-harness binaries
            cargoExtraArgs = "--bin jcode";
          }
        );

      in
      {
        # --- Packages ---
        packages = {
          default = jcode;
          inherit jcode;
        };

        # --- Development shell ---
        devShells.default = pkgs.mkShell {
          # Pull in all the same deps as the package build
          inputsFrom = [ jcode ];

          packages = with pkgs; [
            rustToolchain
            cargo-watch # `cargo watch -x check` for fast feedback
            cargo-edit # `cargo add` / `cargo rm`
          ];

          # Convenience: tell rust-analyzer where the stdlib source lives
          RUST_SRC_PATH = "${rustToolchain}/lib/rustlib/src/rust/library";
        };

        # --- Checks (run with `nix flake check`) ---
        checks = {
          inherit jcode;

          # Clippy lint check
          jcode-clippy = craneLib.cargoClippy (
            commonArgs
            // {
              inherit cargoArtifacts;
              cargoClippyExtraArgs = "--all-targets -- --deny warnings";
            }
          );

          # Format check
          jcode-fmt = craneLib.cargoFmt { inherit src; };
        };
      }
    );
}
