---
"@valtown/skills": minor
---

Add a `restricted-access` skill covering app access (`httpPrivacy`) — the axis that controls who can call a val's HTTP endpoints, independent of the `privacy` setting that controls who can read its code. Explains what agents can't infer from a failed request: access is granted to whole organizations (a viewer needs a grant *and* membership in the granted org, rechecked on every request), so an unauthenticated caller gets a `302` to a login page rather than the val's response — which surfaces as `fetch_val_endpoint` refusing to follow a redirect, or an API client receiving login HTML where it expected JSON, neither of which is a bug in the val's code. Also covers project-scoped bypass tokens for webhooks and other machine callers, and the `X-Val-Town-User` → `GET /v3/val/viewer` exchange for identifying a human viewer inside a restricted val.

The most consequential piece is disambiguation from `std/oauth`: both answer "make my app require a login," but restricted access gates at the platform edge before your code runs and admits organizations, while `std/oauth` runs inside the val and gives it its own logged-in users. Applying both to one val makes visitors authenticate twice. The `oauth` skill gains a reciprocal pointer, and `http-endpoints` no longer describes an endpoint URL as unconditionally public.
