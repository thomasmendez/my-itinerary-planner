# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-10-08
 
Security release. **Upgrading from 1.0.0 is recommended.** There are no application
code, database, or configuration changes.
 
### Security
 
- Upgraded `pyjwt` from 2.13.0 to 2.15.1, fixing 14 vulnerabilities (1 critical,
  5 high, 8 medium). The critical one is CVE-2026-102268. The high-severity ones are
  CVE-2026-102266, CVE-2026-102267, CVE-2026-102271, CVE-2026-102272, and
  CVE-2026-102273, covering authentication bypass, token forgery, and verification key
  substitution. The medium ones are CVE-2026-101917, CVE-2026-101918, CVE-2026-102265,
  CVE-2026-102269, CVE-2026-102270, CVE-2026-102274, CVE-2026-102275, and
  CVE-2026-103001
- Rebuilt on the updated base image `python:3.13.16-slim-trixie` (previously 3.13.15),
  fixing 14 vulnerabilities in the OpenSSL and PCRE2 system packages (3 high, 9 medium,
  2 low). The high-severity ones are CVE-2026-75804, CVE-2026-84782, and CVE-2026-103111
- Upgraded `mako` from 1.4.1 to 1.4.2, fixing CVE-2026-102991 (medium, a path traversal
  via drive-letter URIs in `TemplateLookup` that only affects Windows)
- The image scan now reports no critical findings (previously 1) and 44 high findings
  (previously 56)
- Known issues: the remaining findings are in Debian base-image packages such as glibc
  and util-linux, and Debian has not released fixes for them yet. They will be picked
  up when the base image is refreshed. A fix already exists upstream for `liblzma5`
  (DSA-6549-1) and will be picked up in a later base-image update
### Changed
 
- Updated the `uv` build image from 0.12.18 to 0.12.23 and the `uv_build` requirement
  to 0.12.23 or newer (build-time only, not part of the runtime image)
- Updated frontend dependencies, including `@reduxjs/toolkit` 2.12.0 to 2.13.0
- Updated the `astral-sh/setup-uv` GitHub Action from v10.1.0 to v10.2.0
- Pinned the date in the timeline end-to-end test so it no longer depends on the
  current year

## [1.0.0] - 2026-09-24

Initial release.

### Added

- Flight, hotel, and event search through SerpApi, with server-side caching
- Custom entries for flights, hotels, rentals, and events
- Search → candidate → confirmed flow for saved items
- Price comparison across candidates, and a trip budget with spend by category
- Trip calendar, timeline view, and map view with driving routes
- Chat assistant using Claude, OpenAI, or a local Ollama model
- MCP endpoint (`/mcp`) for external AI agents
- Multiple trips, each with its own calendar and saved items
- Docker image for linux/amd64 and linux/arm64, published to
  `ghcr.io/thomasmendez/my-itinerary-planner`

[Unreleased]: https://github.com/thomasmendez/my-itinerary-planner/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/thomasmendez/my-itinerary-planner/releases/tag/v1.0.0
