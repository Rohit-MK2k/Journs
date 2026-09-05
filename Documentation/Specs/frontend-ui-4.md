# Task 4: Search & Semantic Recall UI

## Overview
This specification dictates the UI development for the natural language semantic search overlay (`/search`) which traverses the user's journal entries.

## Goals & Constraints
- **Scope**: Code the UI modals, result cards, highlighted semantic text, and input interactions. Use placeholder hardcoded JSON results to simulate a Vertex AI backend response.
- **SSR Client**: Implementation must follow Next.js SSR principles natively.
- **Testing**: Validate query state transitions, escaping (ESC key), and UI overlay focus traps.

## Screen References (Stitch Project ID: `2790275479103482782`)
Use the `StitchMCP` tools to retrieve design resources for:

### Search Overlay State
- **Light Desktop**: `projects/2790275479103482782/screens/b75f11926f64450db40edc262d9bfcb4`
- **Light Mobile**: `projects/2790275479103482782/screens/fb3d3c97065f4be7900f80e7d96dd08b`
- **Dark Desktop**: `projects/2790275479103482782/screens/8fdc6430e2f34cfd99bded1d23affa52`
- **Dark Mobile**: `projects/2790275479103482782/screens/5a71e1f5043e4519933201e44cb21e24`

### Search Highlight Results View
- **Light Desktop**: `projects/2790275479103482782/screens/a801eadd0f294d5190dc4f78eaf3b4c7`
- **Light Mobile**: `projects/2790275479103482782/screens/4edbbcea727740f48f1b5c28c11bdd2a`
- **Dark Desktop**: `projects/2790275479103482782/screens/fa7a9309a978408caba5700edae4bc99`
- **Dark Mobile**: `projects/2790275479103482782/screens/91a891ab24824b1ea7667e0121d3958f`

### Reverse Transition States
- **Light Desktop**: `projects/2790275479103482782/screens/a9187d09e1a54a65bf855bc51e00a67d`
- **Light Mobile**: `projects/2790275479103482782/screens/8448644a2dcc47dfad811e08e6f87fcd`
- **Dark Desktop**: `projects/2790275479103482782/screens/9be8dc1407cb4949b8cc8b0c197b15f7`
- **Dark Mobile**: `projects/2790275479103482782/screens/4f4458744bf84dccaca33c2dfa3a8c29`

## Implementation Specifications
1. **Overlay Component**: Full-screen modal with blur/dim backdrop over the dashboard.
2. **Search Input**: Pill-shaped auto-focused text field.
3. **Results**:
   - Initial state displays predefined concept chips (`"Reflections about morning coffee..."`).
   - Highlighted Result Cards: Simulate relevance percentage pills and highlight matches in snippet excerpts natively using React spans.
4. **Transition Dynamics**: Hook up simulated state timeouts to represent the reverse/collapse transition back to the main search view.
