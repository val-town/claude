---
"@valtown/skills": patch
---

Teach the immutable asset-caching pattern (`serveImmutableFile` / `immutableFileUrl` from `std/utils`) as the default way to serve client modules, in the `client-side-js`, `http-endpoints`, and `react-ui` skills. The never-cached HTML shell stamps `/__immutable/<version>/...` asset URLs, `serveImmutableFile` answers them with `Cache-Control: immutable` (stale versions 302 to current), and publishing the val bumps the version so invalidation is instant. Measured: repeat visits 665ms → 157ms with zero asset requests.
