# Task 1: Authentication & Sign-In UI

## Overview
This specification details the Next.js frontend implementation for the Authentication page (`/login`).
Journ requires a private, distraction-free authentication gateway relying solely on Google OAuth.

## Goals & Constraints
- **Scope**: Implement the UI and interaction flow only. Do not integrate higher-level backend systems or actual Firestore/Auth services for now.
- **SSR Client**: Next.js Server-Side Rendering principles must be followed. Develop the UI components such that they behave as an SSR application.
- **Testing**: Ensure the UI, responsiveness, and interaction flow are rigorously tested using Next.js compatible testing frameworks.

## Screen References (Stitch Project ID: `2790275479103482782`)
Use the `StitchMCP` tools (e.g., `get_screen`, `read_url_content`) to fetch the exact UI layouts and CSS for these screens:
- **Light Desktop**: `projects/2790275479103482782/screens/09c39f7ebdcb4cc18968c1f11205523f`
- **Light Mobile**: `projects/2790275479103482782/screens/b12cc12529bd45bd956625adfabbd89d`
- **Dark Desktop**: `projects/2790275479103482782/screens/4d9ccf2d0fb64d218f20bbb6aa9a10fb`
- **Dark Mobile**: `projects/2790275479103482782/screens/e8cb1b65d9cf4f97a0ecd65dd09c411e`

## Implementation Specifications
1. **Layout**: Centered, minimal floating card on a full canvas layout.
2. **Components**:
   - Header tag (`• EDITORIAL JOURNALING •`)
   - Brand Wordmark (Serif, `Newsreader` font)
   - Action Button: `"Continue with Google"` with standard 4-color "G" glyph.
   - Trust Assurance: Privacy text and lock icon.
3. **Interactions**:
   - Single click triggers the OAuth flow. (For UI-only implementation, simulate the redirect to the dashboard `/`).
4. **Theme Variations**: Ensure correct CSS implementation for both `Light Warm Paper` and `Dark Charcoal` themes based on the system tokens.
