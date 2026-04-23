# Static Assets

Place your static assets (images, fonts, etc.) in this directory.

## Usage

Files in this directory are served at the root path during development and copied to the root of the dist folder during build.

### Examples:

- `public/logo.png` → accessible at `/logo.png`
- `public/images/photo.jpg` → accessible at `/images/photo.jpg`

### In your code:

```tsx
// Reference directly by path
<img src="/logo.png" alt="Logo" />
<img src="/images/photo.jpg" alt="Photo" />
```

### Notes:

- Do NOT import these files - reference them directly by path
- Files are copied as-is without processing
- Use `src/assets/` for assets that need to be processed/bundled by Vite
