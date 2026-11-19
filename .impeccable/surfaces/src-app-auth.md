---
version: 1
slug: "src-app-auth"
primary_target: "src/app/(auth)"
related_targets: []
---

# Auth surface (/sign-in, /sign-up)

Mode: Operate. Audience: members of small teams opening Kanbanary to get to their boards. Task: sign in or create an account in seconds and land in the app. No marketing claims.

## Direction contract

THESIS: Show the product at the door. A split screen pairs a plain form with a live-looking board preview, instead of a lone card on grey. Replaces the rejected "Caderno pautado" notebook world (user: dated, not modern).

OWN-WORLD: Modern SaaS. White form side and an indigo brand panel (#4f46e5, columns #4338ca). Zinc neutrals (#18181b text, #71717a muted, #e4e4e7 borders). Standard shadcn inputs and buttons with an 8px radius, Geist, and a logo mark made of three bars like board columns.

STORY: The visitor sees their tool on the right, the form on the left, fills two or three fields, and lands in the app.

FIRST VIEWPORT: Desktop has two equal columns. On the left: the logo top-left, then a ~384px form centred vertically (h1, one-line description, fields, full-width indigo button, switch link). On the right: the indigo panel with "Sprint 14 · Time de produto" and three board columns of white cards that bleed off the right edge. On mobile the panel is hidden and the form is top-aligned under the logo.

FORM: Proposal A of three rendered mockups chosen by the user (split with board preview), replacing seed a833cb04.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
