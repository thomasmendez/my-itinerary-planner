# Security Policy

The goal is to keep the Itinerary Planner project secure and safe for end users.

Note that the app has no authentication and is meant for a single user or
household on a trusted network (see README).

## Tools

The following tools are used to help mitigate vulnerabilities:

- [Dependabot](https://docs.github.com/en/code-security/dependabot)
  - Submits pull requests to upgrade dependencies. Uses Dependabot's version
    updates as well as security updates
- [Trivy](https://github.com/aquasecurity/trivy)
  - Vulnerability scanner that runs on PRs into the default branch and weekly.
    Scans the repository code (see `.github/workflows/security-scan.yml`) and
    the container image (see `.github/workflows/docker.yml`)

## Supported Versions

Only the latest release, and the `main` branch, receive security fixes.

## Reporting a Vulnerability

Please do not open a public issue for a security problem. Report it privately
through GitHub's Private Vulnerability Reporting:
<https://github.com/thomasmendez/my-itinerary-planner/security/advisories/new>

This is a solo-maintained project, so responses are best effort. Include the
affected version, steps to reproduce, and the impact you expect.
