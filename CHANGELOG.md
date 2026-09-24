# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
