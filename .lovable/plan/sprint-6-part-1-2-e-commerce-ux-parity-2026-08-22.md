# Sprint 6 (Part 1/2) — E-commerce UX Parity

Implement marketplace-standard UX patterns (grid density, categories, banners, flash deals, breadcrumbs) while maintaining the established premium visual identity.

## Technical Details

### 1. Database Schema
- Create `banners` table for manual campaign management.
- Update `products` to ensure `discount` and expirable campaigns are queryable for "Flash Deals".

### 2. New Components
- **CategoryStrip**: Horizontal scrolling list of category icons/labels.
- **BannerCarousel**: Auto-playing premium banner section.
- **FlashDeals**: Grid of timed offers with real countdowns.
- **Breadcrumbs**: Navigational aid for category and product pages.
- **ListingFilters**: Sticky filter bar for density-optimized list pages.

### 3. Layout Adjustments
- Increase mobile grid density to 2 columns for all listing pages.
- Implement sticky positioning for navigation and filter bars.

### 4. Page Updates
- **Home (`/`)**: Hero -> CategoryStrip -> BannerCarousel -> FlashDeals -> Personalized Feed -> Trending.
- **Listings**: Products, Deals, Search, and Category pages get updated grid and sticky filters.
- **Detail**: Product and Category pages get Breadcrumbs.

## User Review Required

> [!IMPORTANT]
> Urgency triggers (countdowns) will only be displayed when a real `ends_at` date is present in the database, adhering to project transparency rules.

- **Mobile Grid**: We are moving from 1-column large cards to 2-column compact cards on mobile.
- **Visual Identity**: Premium glassmorphism and oklch palette remain; only structural density changes.
