# Task 3: AI Companion UI

## Overview
This specification details the Next.js frontend implementation for the AI Companion interface (`/chat`), allowing text drafting and live voice interactions.

## Goals & Constraints
- **Scope**: Implement the UI and state flow (Modals/Drawers). Mock conversational context and draft merging; do not implement real AI/WebRTC logic yet.
- **SSR Client**: Strictly adhere to Next.js SSR principles.
- **Testing**: Test form components, active state toggles (Text vs Voice), and modal animations.

## Screen References (Stitch Project ID: `2790275479103482782`)
Use the `StitchMCP` tools to fetch and reproduce the UI layout:

### Conversational Chat (Text Mode & Drafting)
- **Light Desktop**: `projects/2790275479103482782/screens/8aa8a3c12cc14ad7b0271921943926f4`
- **Light Mobile**: `projects/2790275479103482782/screens/d319d4a29b4c4156aef3899ce56a2a35`
- **Dark Desktop**: `projects/2790275479103482782/screens/e3efaa8497454354844f3e5665dada47`
- **Dark Mobile**: `projects/2790275479103482782/screens/4b94819a02e340b19dcb0d95560d5704`

### Live Voice Interactive Mode
- **Light Desktop**: `projects/2790275479103482782/screens/3eca9a75d4b248afbef50564cd15397e`
- **Light Mobile**: `projects/2790275479103482782/screens/995f8db4bd6b48e1a9cee49ed03d92f0`
- **Dark Desktop**: `projects/2790275479103482782/screens/f2099c7587d64727aa3816d865b60600`
- **Dark Mobile**: `projects/2790275479103482782/screens/01086930dc84404f98b2df46dbe08370`

### Edit Drafted Note
- **Light Desktop**: `projects/2790275479103482782/screens/c2a1a0eb6a9041aba0fdaf5bae57e79e`
- **Light Mobile**: `projects/2790275479103482782/screens/f70621986b4543629fbaaaf6c48d919d`
- **Dark Desktop**: `projects/2790275479103482782/screens/0738312dd31e477e9e92e18581d4f553`
- **Dark Mobile**: `projects/2790275479103482782/screens/3e319c5dd58c458fb34734a858cb647a`

## Implementation Specifications
1. **Text Chat**:
   - Header with a dual-mode switcher.
   - Chat stream rendering user and assistant bubbles.
   - Embedded "Drafted Journal Note" cards with explicitly distinct action buttons.
2. **Live Voice**:
   - Concentric pulse animations with microphone glyph.
   - UI status indications (`"Companion is listening..."`).
   - Mute and End Call control dock.
3. **Draft Edit Mode**:
   - Full-screen takeover allowing unrestrained edits.
   - Mock destinations logic: Radio selection for "Append" vs "New Entry".
