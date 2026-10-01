# M01 Design System Baseline

## Principles

- Responsive and mobile-first.
- Strong typography and whitespace instead of excessive decoration.
- Accessible focus states and sufficient contrast.
- Motion is subtle and disabled/reduced when the user requests reduced motion.
- Reusable primitives are composed into feature components; feature modules should not duplicate base controls.

## Tokens

Tokens are defined in `src/app/globals.css` using CSS custom properties and Tailwind v4 theme mapping.

Current token groups:

- background / foreground
- card / card foreground
- primary / primary foreground
- secondary / secondary foreground
- muted / muted foreground
- border
- focus ring
- radius scale
- system sans-serif font stack

The base theme follows the operating-system light/dark preference. A manual theme switch can be added later if product requirements need it.

## Base components

- `Button`
- `Badge`
- `Card` family
- `Container`
- `Skeleton`
- `LoadingState`
- `EmptyState`
- `ErrorState`

Later modules should reuse these components and extend them only when the feature has a genuine new interaction requirement.
