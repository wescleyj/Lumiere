# Design System: Lumiere

## Stack
- framework: React 19 + Vite 6 (JavaScript ESM, no TypeScript)
- styling: Vanilla CSS with CSS Custom Properties (`src/frontend/src/styles/tokens.css` and `global.css`)
- components: Custom domain components for Netflix-inspired streaming catalog, 10-entity CRUD studio, and 5 SQL analytical reports
- animation: Purposeful micro-transitions (150ms-240ms ease-out) guarded by `prefers-reduced-motion`
- icons: `lucide-react`

## Tokens
- brand-red: `#E50914` (`--brand-red-hover: #F6121D`, `--brand-red-active: #B20710`)
- bg-canvas: `#141414`
- bg-surface: `#181818`
- bg-raised: `#222222`
- bg-hover: `#2C2C2C`
- text-primary: `#FFFFFF`
- text-secondary: `#E5E5E5`
- text-muted: `#A3A3A3`
- border-subtle: `rgba(255, 255, 255, 0.10)`
- border-strong: `rgba(255, 255, 255, 0.22)`
- status: `--status-success: #46D369`, `--status-warning: #E5A00D`, `--status-danger: #E50914`
- rating DJCTQ: `--rating-L: #0C9447`, `--rating-10: #00AEEF`, `--rating-12: #F7D117`, `--rating-14: #F58220`, `--rating-16: #ED1C24`, `--rating-18: #181818`
- poster themes: `--poster-noir`, `--poster-amber`, `--poster-cyan`, `--poster-emerald`, `--poster-crimson`, `--poster-slate`
- typography: `'Bebas Neue'` (display wordmark and hero titles) + `'DM Sans'` (UI, tables, forms, body)
- radius: `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 8px`

## Decisions
- 2026-11-26 — init: React + Vite (JavaScript) chosen for `src/frontend/` following Netflix theater dark identity (`#141414` canvas, `#E50914` primary red, Bebas Neue display + DM Sans body). No video hosting: built-in art-directed 2:3 movie covers + optional `capa_url` image URL support.
- 2026-11-26 — architecture: Pure relational client-side store persisted in `localStorage` (`lumiere_db_v1`) covering all 8 strong entities and N:M / 1:N relationships (`Atua`, `Pertence_a`, `Avalia`) from `docs/Modelo_Conceitual.md`, plus dynamic calculation of all 5 required SQL reports.
- 2026-11-26 — build: Implemented all 10 UI components and data layer strictly adhering to CSS custom properties and `prefers-reduced-motion`.
- 2026-11-26 — polish: Fixed search input icon padding order, added bespoke SVG cinema poster motifs (`posterArt.jsx`), added `BrandSplash`/`CatalogSkeleton`/`TableSkeleton` (`LoadingStates.jsx`), hero carousel, "Continuar assistindo" & "Em alta no Lumiere" rails, KPI strip in CRUD, and inline metric bars in SQL reports.

## Components
- `Navbar` (`src/frontend/src/components/Navbar.jsx`)
- `RatingBadge` (`src/frontend/src/components/RatingBadge.jsx`)
- `MoviePoster` (`src/frontend/src/components/MoviePoster.jsx`)
- `PosterArtwork` (`src/frontend/src/components/posterArt.jsx`)
- `LoadingStates` (`src/frontend/src/components/LoadingStates.jsx`)
- `ProfileGateModal` (`src/frontend/src/components/ProfileGateModal.jsx`)
- `CatalogView` (`src/frontend/src/components/CatalogView.jsx`)
- `MovieDetailModal` (`src/frontend/src/components/MovieDetailModal.jsx`)
- `EntityFormModal` (`src/frontend/src/components/EntityFormModal.jsx`)
- `CrudView` (`src/frontend/src/components/CrudView.jsx`)
- `ReportsView` (`src/frontend/src/components/ReportsView.jsx`)
- `Toast` (`src/frontend/src/components/Toast.jsx`)

## Non-Goals
- No real video streaming or media transcoding
- No TypeScript compilation step
- No modification to `src/backend/` or `sql/`
