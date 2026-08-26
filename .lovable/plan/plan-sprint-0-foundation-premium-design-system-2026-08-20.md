# Plan - Sprint 0: Foundation & Premium Design System

Implement the premium visual identity and core layout components as defined in Sprint 0.

## User Review Required

> [!IMPORTANT]
> - **Primary Branding**: I will use the "Technological Deep Blue" palette established in `styles.css`.
> - **Typography**: Using Inter/sans-serif as standard for reliability.
> - **Iconography**: Using Lucide-react as the primary library.

## Proposed Changes

### Core Design System
- Update `src/styles.css` with semantic "Glass" and "Gloss" utility variables for premium depth.
- Refine color tokens for better contrast in dark/light mode transition.

### Layout System
- **Navbar**: Floating premium navigation with glassmorphism, search bar, and profile access.
- **Sidebar (Admin)**: Modern, collapsible sidebar with active states.
- **Footer**: Clean, multi-column footer with marketplace links.

### Home Page Transformation (src/routes/index.tsx)
- **Hero**: High-impact section with animated text and "Technological" accents.
- **Product Grid**: Live-ready grid using `ProductCard` and `VideoCard`.
- **Search Overlay**: Premium search experience for discovery.

### Component Refinement
- **ProductCard**: Add "Gloss" effects and refined typography.
- **Loading States**: Improve skeletons for a "smooth" feel.

## Technical Details

- **Tailwind v4**: Using native CSS variables and `@theme` for performance.
- **TanStack Router**: Ensuring all routes have explicit `head()` metadata.
- **Glassmorphism**: Using `backdrop-blur` and `oklch` opacities for depth.

## Sprint 0 Task List
- [ ] Refine `src/styles.css` tokens.
- [ ] Create `src/components/layout/Navbar.tsx`.
- [ ] Create `src/components/layout/Footer.tsx`.
- [ ] Update `src/routes/__root.tsx` to include Global Layout components.
- [ ] Rebuild `src/routes/index.tsx` into a premium showcase.
- [ ] Update `src/components/product/ProductCard.tsx` with premium styles.
