---
"@valtown/skills": patch
---

Teach the immutable asset-caching pattern (`serveImmutableFile` / `immutableFileUrl` from `std/utils`) in the `client-side-js`, `http-endpoints`, and `react-ui` skills: the never-cached HTML shell stamps `/__immutable/<version>/...` URLs, served with `Cache-Control: immutable`; publishing bumps the version, invalidating automatically (old-version URLs 404). Measured: repeat visits 665ms → 157ms with zero asset requests.
