# Plan: Sprint 11 (Part 1/2) — Full Mobile Audit & Secure Admin Setup

This plan addresses a comprehensive mobile usability audit for all public and account routes and establishes a secure process for administrative access.

## Objectives
1. **Secure Admin Setup**: Promote `eaglesfr49@gmail.com` to `owner` safely without hardcoding credentials.
2. **Mobile Usability Audit**: Ensure 100% of the public and account-facing UI works perfectly on mobile devices, following accessibility and modern mobile UX standards.

## Proposed Changes

### 1. Database & Security
- **Admin Promotion**: Provide instructions for the user to execute a manual SQL update to promote their account to `owner`.
- **Verify Role**: Recommend checking that only one account holds the `owner` role.

### 2. Global Styles (`src/styles.css`)
- **Safe Area Insets**: Add utility classes for `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` to ensure UI elements aren't cut off by hardware features (notches, gesture bars).
- **Touch Target Utilities**: Ensure all interactive elements have at least `44px` height/width through standard utility classes or custom variables if needed.

### 3. Navigation (`src/components/layout/Navbar.tsx` & others)
- **Bottom Navigation**: Enhance mobile-specific navigation to ensure it doesn't overlap content and respects safe areas.
- **Mobile Menu**: Refine the mobile menu trigger and layout for better thumb reachability.

### 4. Route-Specific Mobile Optimization
- **Home & Feed (`/`, `/feed`)**: Adjust grid spacing and card sizes for smaller viewports.
- **Product Details (`/product/:slug`)**: Ensure the gallery and "Buy Now" CTA are optimized for thumb interaction.
- **Video Feed (`/videos`)**: Fix snap-scroll behavior for mobile browsers and ensure controls are accessible.
- **Forms (`/auth`, `/register`, `/profile`)**: 
  - Set correct `inputmode` and `type` for virtual keyboards.
  - Ensure labels and inputs are appropriately sized.
  - Fix button positioning to avoid being hidden by the keyboard.

### 5. Components UI
- **Product Cards**: Adjust font sizes and badge placement for mobile density.
- **Modals/Drawers**: Convert specific desktop-centric modals to mobile-friendly drawers where appropriate.

## Technical Details
- Use `shadcn/ui` components' built-in responsive classes.
- Leverage Tailwind `md:` and `lg:` prefixes to maintain desktop integrity while fixing mobile.
- Use `touch-none` or `pointer-events-auto` appropriately to manage gesture overlaps.
- **Files to touch**: `src/styles.css`, `src/components/layout/Navbar.tsx`, `src/routes/videos.tsx`, `src/routes/auth.tsx`, `src/routes/register.tsx`, `src/components/product/ProductCard.tsx`.

## Validation Plan
1. **Manual Inspection**: Use Playwright to simulate various mobile viewports (iPhone SE, Pixel 7, iPad Mini).
2. **Acessibility Check**: Verify touch targets are >= 44x44px.
3. **Form Testing**: Verify keyboard behavior in mobile simulation.
4. **Final Audit**: Confirm secure admin status via `lovable supabase query`.
