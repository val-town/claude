---
"@valtown/skills": minor
---

Add a `client-side-js` skill covering how to serve client-side JavaScript modules. Val Town has no build step, so this explains the actual mechanics agents otherwise have to reverse-engineer: `serveFile` transpiling `.ts`/`.tsx`/`.jsx` to browser-ready JS per request, loading a module with `<script type="module">`, how the browser resolves local imports (explicit extensions) and third-party deps (full ESM URLs), and the esm.town direct-serve alternative. Fills a gap between `react-ui` (JSX/styling conventions) and `http-endpoints` (handler/CORS), and is framework-agnostic.
