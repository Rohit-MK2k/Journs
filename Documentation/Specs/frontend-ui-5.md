# Task 5: Account & Settings UI

## Overview
This specification dictates the UI construction of the Account & Settings view (`/settings`), managing user profile displays, themes, and danger-zone data controls.

## Goals & Constraints
- **Scope**: Code the UI. Mock user info (`Alex Chen`), toggle states for Habit Memory, and Theme toggling.
- **SSR Client**: Next.js Server-Side Rendering paradigms apply.
- **Testing**: Test the validation logic for the "Danger Zone" account deletion.

## Screen References (Stitch Project ID: `2790275479103482782`)
Use the `StitchMCP` tools to retrieve design resources for:

- **Light Desktop**: `projects/2790275479103482782/screens/45d56b3a21554357b133aca6e6308a8a`
- **Light Mobile**: `projects/2790275479103482782/screens/5046e770b3b94391b46a1b0d4cb683e4`
- **Dark Desktop**: `projects/2790275479103482782/screens/709ac8623d234857b335cb24573c56a5`
- **Dark Mobile**: `projects/2790275479103482782/screens/0de50fe749114a93a5156c4e5de18f8b`

## Implementation Specifications
1. **Google Identity Card**: Rounded avatar, name, email. Rendered natively.
2. **Theme Segmented Control**: `[Light (Warm Paper)]` | `[Dark (Charcoal)]` | `[System]`. The UI must react locally to switch the simulated application theme CSS.
3. **Toggles**: On/Off switches modeled identically to native mobile aesthetics.
4. **Danger Zone Component**:
   - Must implement a text input requiring the exact string `"DELETE"` to enable the final red destruction button. 
   - State management handles the disabled/enabled button logic.
