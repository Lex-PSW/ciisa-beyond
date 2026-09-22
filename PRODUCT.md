# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audience: existing CiiSA | PSW clients, plus the prospects/colleagues those clients refer or bring along. Not an open public-marketing funnel — copy can assume baseline familiarity with CiiSA | PSW rather than introducing the company from scratch. These are B2B decision-makers evaluating infrastructure, AI, security, and digital-workspace technology for their own organizations, and their job on this page is to confirm attendance (RSVP) for a specific in-person event.

## Product Purpose

This is a single-event landing page for **CiiSA Beyond Expo 2026**, a one-day in-person B2B technology expo:

- Date/time: Miércoles 21 de Octubre 2026, 10:00 AM – 7:00 PM
- Venue: El Ejecutivo Eventos, Río Danubio 395-B-Oriente, Del Valle, 66220 San Pedro Garza García, N.L.

The page exists to drive event registrations through an embedded Microsoft Forms RSVP. **Success is measured by registration count (RSVP maximization)** — that is the single top metric this page optimizes for, above lead-gen or brand-awareness framing.

## Positioning

"Beyond" is CiiSA | PSW's event sub-brand, positioned as going past a generic vendor trade show: "Más allá de la tecnología: decisiones que impulsan el futuro." The differentiator is direct, in-person access to CiiSA | PSW's own technology-partner ecosystem (HPE, Dell, Microsoft, Lenovo, ASUS, Poly, Pyxoom, etc.) in one place, framed around business outcomes and real success stories rather than product pitches.

## Operating Context

- Single scrolling landing page, no multi-page navigation.
- Sections in order: hero (Beyond + CiiSA animated logos, date/time, CTA) → sponsor logo carousel → event agenda ("Conoce Beyond": Registro 10:00 AM, Networking, descuentos exclusivos, casos de éxito, rifas/sorpresas, Clausura 7:00 PM) → expo highlight/description → venue details + embedded map → countdown timer + embedded Microsoft Forms registration → footer.
- Registration is handled entirely through an embedded Microsoft Forms `<iframe>`; there is no custom backend.
- A live countdown (`countdown.js`) counts down to the event's start (2026-10-21T10:00:00-06:00).
- Deploy target: GitHub Pages under `Lex-PSW/ciisa-beyond` (public URL `https://lex-psw.github.io/ciisa-beyond/`).

## Capabilities and Constraints

- Static HTML/CSS/vanilla JS, no framework and no build step. Do not introduce a bundler/framework without asking.
- Custom Lottie animations for the "Beyond" and "CiiSA" wordmarks, hand-built from AI-exported SVGs (`assets/img/Beyond Logo.svg`, `assets/img/CiiSA Logo - Animation.svg`) into `assets/lottie/*.json`. The "O" in Beyond is a solid `ciisa-green` ring (no gradient) with a small white marker that loops a continuous rotation after the reveal intro — this was a deliberate simplification after the source SVG's gradient asset kept coming out broken from Illustrator exports.
- Hero background is a fixed/parallax `<video>` element, reused across sections (reappears behind the registration section).
- Sponsor logo strip (`brands-carousel.js`) is a hand-rolled infinite auto-scrolling + drag-to-scroll carousel, not a library. It always opens with Pyxoom.
- Legacy files not part of the current product: `cursos.js`, `script.js`, `timeline-auto-flip.js`, and the root `README.md` ("Capacitacion-Pyxoom" / client-training scheduler) are leftovers from a prior, unrelated repo purpose this project was repurposed from. Don't treat their contents as current product truth.
- Known open gap: the venue photos currently in the location section (`assets/img/lumm-outside.png`, `assets/img/luum-vista.png`) still show the **previous** venue (Luum Events), not El Ejecutivo Eventos. They must be replaced with real photos before ship; do not fabricate a substitute.

## Brand Commitments

- Parent brand: **CiiSA | PSW**. Event sub-brand: **Beyond**.
- Fixed color-and-order system, binding across the whole site: every multi-stop gradient (text, buttons, dividers, glows) follows `ciisa-green (#bcf200) → psw-mint (#01fbce) → electric-pyx (#00ccff)`, in that order. Do not introduce the old rose/purple/electric-blue palette.
- Confirmed sponsor/partner lineup, always led by Pyxoom: HPE, HP (Inc.), HPE Networking, Dell Technologies, Microsoft, Pyxoom (HR) ai, Poly, Lenovo, ASUS.
- Footer copyright reads "PSW Global Solutions"; legal links point to `pyxoom.com`.
- Official reference asset for date/time/venue/sponsor-lineup facts: the approved event flyer and `assets/img/meta-placeholder.png` (also used as the `og:image`/`twitter:image` social-share card). Treat it as source of truth over older copy found elsewhere in the file.

## Evidence on Hand

- Real venue address and hours: confirmed via the official flyer (Miércoles 21 de Octubre, 10:00 AM–7:00 PM, El Ejecutivo Eventos, Río Danubio 395-B-Oriente, Del Valle, San Pedro Garza García, N.L.).
- Real sponsor SVG logos in `assets/img/logos/`.
- No venue photography exists yet for the current venue — the two location images on the page are stale (see gap above).
- No testimonials, case studies, or pricing exist for this page; do not invent any when asked for "social proof" style content.

## Product Principles

1. The flyer/`meta-placeholder.png` is the single source of truth for date, time, venue, and sponsor lineup — never assume or invent a change to these facts without new evidence from the user.
2. Every above-the-fold and CTA decision should optimize for one metric: RSVP count via the embedded registration form.
3. The green → mint → cyan gradient order and the Beyond/CiiSA Lottie marks are the fixed visual identity; new decorative gradients or animated brand elements must follow the same order and style rather than introducing new palettes.
4. Copy can assume the reader already has some relationship to CiiSA | PSW (client or referral) — no need to re-introduce the company from first principles.
5. The sponsor carousel always opens with Pyxoom before the external hardware/software partners.
