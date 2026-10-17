# styles/

Design tokens live in `tailwind.config.js` and the base/utilities layer in
`app/globals.css` (Tailwind’s `@layer components`). This folder is reserved for
extracted global CSS — for example a future print stylesheet, a map theme or a
large rtl-specific override file — so the root structure keeps a dedicated,
visible home for stylesheets alongside `app/`, `components/` and `lib/`.

Conventions if you add files here:

- import them from `app/layout.tsx` after `globals.css`;
- keep them global-only, never component-scoped (use Tailwind/CSS modules for
  component styling);
- use the palette tokens documented in `tailwind.config.js`
  (`brand`, `signal`, `mist`, `night`, `ink`), not raw hex values.
