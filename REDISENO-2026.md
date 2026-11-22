# Navecitas — 2026 visual refresh

This update keeps the original Spring Boot (Java 21) application and all functional JavaScript, endpoints, security checks, forms, field names, and form IDs intact. The changes are principally visual.

## Main changes

- `src/main/resources/static/index.html`: replacement landing page, using the image supplied by the project owner, with navigation, a 2-CTA hero, asymmetric feature cards, workflows, role-perspective cards, role-based access cards, final CTA, SEO/Open Graph tags, and footer.
- `src/main/resources/static/css/portada.css`: new, responsive landing styles with subtle CSS-only motion.
- `src/main/resources/static/css/sereno.css`: additive visual layer shared by the 11 other pages. The original `app.css` is unchanged.
- `src/main/resources/static/css/imagenes/hero-navesitas.png`: the uploaded vessel photo.
- `src/main/resources/static/css/imagenes/ship-icon.svg`: line-art ship symbol.
- `src/main/resources/static/favicon.svg`: site icon.
- All 11 existing operational pages import `sereno.css`; login and account creation also show a photo panel with translucent backdrop blur. Common footers are visual additions.
- `design.md`: supplied design reference. The repository's existing `DESIGN.md` is retained as supplied.

## Important constraints

1. The landing page and new descriptive content are in English, consistent with the supplied design prompt. Existing transactional forms and dynamic system messages **remain in Spanish** to avoid changing business copy, validation strings, or test expectations. A complete locale translation is a separate development task.
2. The project is an **academic simulation**. The landing does not assert that it is an official government website. Provisional patents are not legally valid.
3. Access cards describe role-based permissions, **not real subscription prices**. Perspective cards are illustrative and **not actual customer testimonials**.
4. The screenshots supplied separately are previews of rendered HTML/CSS with backend JS disabled and clearly illustrative example data on certain dynamic pages (inbox, reports, vessel file, provisional patent and verification). They are not evidence of server operations.
5. Responsive composition was checked at 390px browser width for all 12 pages with no horizontal page overflow. Existing mobile form/table rules in `app.css` are preserved.

## Run with the original project

Requires Java 21, Maven wrapper and the database configuration described in the original project documentation.

```bash
./mvnw spring-boot:run
```

Open `http://localhost:8080/` for the landing and `http://localhost:8080/login.html` to sign in. Do not open the HTML directly from the file system: absolute `/css` and `/js` paths are designed for Spring Boot's static asset server.

## Verification performed

`node --test src/test/js/*.test.cjs` — 37 tests passed / 0 failed. Java integration tests and full browser-to-backend end-to-end testing were not run here. All original JS and Java source files are unchanged.
