# Task 2: Main Dashboard UI ("The Cake")

## Overview
This specification details the Next.js frontend implementation for the Main Dashboard (`/`), which serves as the core reading and writing experience of Journ.

## Goals & Constraints
- **Scope**: Implement the UI and interaction flow only. Mock the data structures (entries, attachments) without connecting to the backend.
- **SSR Client**: Next.js Server-Side Rendering principles must be followed. The application must behave as an SSR client.
- **Testing**: Ensure the UI renders correctly across states and is well-tested.
- **Negative Constraints**: NEVER add a manual "Save" button. Autosaving should be a visually simulated background process (UI only).

## Screen References (Stitch Project ID: `2790275479103482782`)
Fetch the layout HTML via `StitchMCP` tools for the following screens:

### Today & Timeline (Writing State)
- **Light Desktop**: `projects/2790275479103482782/screens/5e03e916036f43408d83b9261666c73c`
- **Light Mobile**: `projects/2790275479103482782/screens/ca2646ab2d9b41c497095ae92c138147`
- **Dark Desktop**: `projects/2790275479103482782/screens/fe72569b372b4b74badc8e4675e5227f`
- **Dark Mobile**: `projects/2790275479103482782/screens/ec59eaf2653e418e975f49ba63afefb2`

### Today & Timeline (Merged Reflection State)
- **Light Desktop**: `projects/2790275479103482782/screens/43d3ccb2f1d642588b42a9a59cb4dc05`
- **Light Mobile**: `projects/2790275479103482782/screens/f73d225082744886a923a83347dd464b`
- **Dark Desktop**: `projects/2790275479103482782/screens/8815716997324a88afe7c5e958d44085`
- **Dark Mobile**: `projects/2790275479103482782/screens/bcddb50a0e01455ab89e9f626e650689`

### Expanded Past Entry View
- **Light Desktop**: `projects/2790275479103482782/screens/36ffa7aa392642f8926b1e34974722ae`
- **Light Mobile**: `projects/2790275479103482782/screens/5b9d3a96153d4f3888aca5bdbd684e6f`
- **Dark Desktop**: `projects/2790275479103482782/screens/c2d8104083ae4ef68a2a50ce9f6f93da`
- **Dark Mobile**: `projects/2790275479103482782/screens/f9cac1c829e24af4b8a381f5696fed4c`

### Transition States (To Full Entry)
- **Light Desktop**: `projects/2790275479103482782/screens/cbde1adee60540e8be4d59289ba34aff`
- **Light Mobile**: `projects/2790275479103482782/screens/30f8d5afde43480ca4e90789879464bc`
- **Dark Desktop**: `projects/2790275479103482782/screens/f0b619bbc08c4248b783dd2847e72a91`
- **Dark Mobile**: `projects/2790275479103482782/screens/fc4828e31716490d998cbb60460d0226`

## Implementation Specifications
1. **Layout**: Max width `680px` canal layout.
2. **Components**:
   - **Editor (Today)**: Auto-focused `textarea`, date header (`Newsreader`), minimal icons for Voice, Photo, and Location attachments.
   - **Timeline**: Stack of past entries (cards) with AI-generated summary snippets.
   - **FAB**: Floating action button (bottom right) for the AI Companion (simulates opening `/chat`).
3. **Interactions**:
   - Clicking a timeline card expands it to the "Expanded Past Entry" full view.
   - Typing triggers a simulated autosave status debounced in the header.
