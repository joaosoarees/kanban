---
version: 1
slug: "src-app-auth"
primary_target: "src/app/(auth)"
related_targets: []
---

# Auth surface (/sign-in, /sign-up)

Mode: Operate. Audience: members of small teams opening Kanbanary to get to their boards. Task: sign in or create an account in seconds and land in the app. No marketing, no invented claims.

## Direction contract

THESIS: The app is an open school notebook; the auth screens are its first page. Refuses the category default of a centred white card floating on grey with a logo above it.

OWN-WORLD: White sheet, pale-blue ruling every 24px across the whole viewport (#a9d3ef), one 1px red margin rule (#e0483e) left of the writing column, Bic-blue ink (#1d3bb3) for the wordmark, primary action and focus, graphite (#1f2328) for body text. Fields are writing lines: an underline on the ruling, no boxes. Red appears only for errors and destructive actions.

STORY: The visitor recognises a page to write on, reads one heading, fills two or three lines and presses one blue button. Errors are written on the next ruled line in red.

FIRST VIEWPORT: A ~360px writing column set left of centre, the red margin rule running the full height just before it. Top to bottom on the ruling: Kanbanary wordmark in ink, the heading, the fields, the primary button, the switch link. Every baseline sits on a 24px rule. Mobile keeps the margin rule with 16px gutters.

FORM: Caderno pautado, candidate 6 of 7 on my grounded list, seed a833cb04. Raises: the ruling is the real grid (Crouwel); one text size for card content (timetable); red has a single job (airport wayfinding).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
