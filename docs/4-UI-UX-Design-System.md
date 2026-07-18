# UI/UX Design System — College App for Students

## 1. Theme

- **Mode:** Dark theme throughout
- **Aesthetic:** Glassmorphism + 3D effects + neon accent
- **Background:** Animated 3D scene (Three.js) with floating geometric shapes, particles, grid floor

## 2. Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0a0a1a` | Main page background |
| `--bg-secondary` | `#12122a` | Card and container backgrounds |
| `--bg-card` | `rgba(18, 18, 42, 0.6)` | Glass card backgrounds |
| `--accent` | `#6366f1` | Primary accent (indigo) |
| `--accent-glow` | `rgba(99, 102, 241, 0.12)` | Subtle accent background |
| `--text-primary` | `#e8e8f0` | Primary text |
| `--text-secondary` | `#a0a0b8` | Secondary text |
| `--text-muted` | `#6b6b80` | Muted / placeholder text |
| `--border` | `rgba(255, 255, 255, 0.08)` | Borders and dividers |
| `--success` | `#22c55e` | Approved status, success states |
| `--warning` | `#eab308` | Pending status |
| `--error` | `#ef4444` | Rejected status, errors |
| `--gradient-1` | `linear-gradient(135deg, #6366f1, #8b5cf6)` | Accent gradient |

## 3. Typography

| Property | Value |
|----------|-------|
| Font Family | `'Inter', sans-serif` |
| Base Size | 16px |
| Headings | `h1: 1.8rem`, `h2: 1.4rem`, `h3: 1rem` |
| Body | `0.9rem` |
| Small | `0.75rem-0.85rem` |

## 4. Components

### 4.1 Cards (`.card`)
- Dark glass background: `rgba(18, 18, 42, 0.6)`
- Border: `1px solid var(--border)`
- Border-radius: 12-16px
- Backdrop-filter: blur
- Optional 3D hover effects (`.card-3d`)

### 4.2 Buttons

| Class | Style | Usage |
|-------|-------|-------|
| `.btn-primary` | Accent background, white text | Primary actions |
| `.btn-ghost` | Transparent, muted border | Secondary actions |
| `.btn-danger` | Red tones | Destructive actions |

- All buttons have hover scale (1.01-1.02) and tap scale (0.98-0.99) via Framer Motion
- 3D variant (`.btn-3d`) with perspective transform

### 4.3 Input Fields (`.input-field`)
- Background: `var(--bg-secondary)`
- Border: `1px solid var(--border)`
- Border-radius: 10-12px
- Padding: `12px 16px`
- Text: `var(--text-primary)`
- Placeholder: `var(--text-muted)`
- Focus: accent border glow

### 4.4 Select Dropdowns
- Same styling as `.input-field`
- Chevron icon (browser default styled)

### 4.5 File Upload Area
- Dashed border: `2px dashed var(--border)`
- Centered upload icon + text
- Click triggers hidden file input
- Shows filename after selection

### 4.6 Badges / Tags
- Pill shape (border-radius: 20px)
- Padding: `8px 16-18px`
- Accent background glow
- Used for subjects, languages, status indicators

### 4.7 Status Badges
| Status | Color |
|--------|-------|
| Approved | Green (`var(--success)`) |
| Pending | Yellow (`var(--warning)`) |
| Rejected | Red (`var(--error)`) |

### 4.8 Progress Indicators
- Step dots (registration): small circles, filled accent for current, green for completed
- Loading spinner: Framer Motion spin animation

## 5. Layout

### 5.1 Desktop (>768px)
```
┌─────────┬────────────────────────────────────┐
│         │                                    │
│ Sidebar │         Main Content               │
│  (240px) │         (flex-grow)               │
│         │                                    │
│  Fixed  │         Scrollable                 │
│         │                                    │
└─────────┴────────────────────────────────────┘
```

### 5.2 Mobile (<768px)
```
┌──────────────────────────────────────────────┐
│                                              │
│              Main Content                    │
│              (full width)                    │
│                                              │
├──────────────────────────────────────────────┤
│  Home  │  Chat  │  Comm  │  AI  │  Logout   │
│              Bottom Nav                      │
└──────────────────────────────────────────────┘
```

## 6. Animations

All animations use **Framer Motion**:

| Animation | Type | Duration | Usage |
|-----------|------|----------|-------|
| Page entrance | `opacity: 0→1, y: 20→0` | 0.3-0.5s | All pages |
| Card hover | `y: -4, rotateY: 2-3deg` | 0.2s | Dashboard cards |
| Button | `scale: 1.01 on hover` | 0.1s | All buttons |
| Button tap | `scale: 0.98-0.99` | 0.1s | All buttons |
| Step transition | `x: ±50, opacity` | 0.3s | Registration steps |
| Stagger children | 80ms delay each | — | Dashboard grid |
| Spring | `stiffness: 200` | — | Avatar bounce |
| 3D scene | Continuous | — | ThreeBackground |

## 7. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| <768px | Mobile nav appears, sidebar hidden |
| <480px | Further padding adjustments |
| All sizes | 3D background scales down in complexity |

## 8. Toast Notifications

- Library: `react-hot-toast`
- Position: Top center
- Style: Dark theme (default)
- Duration: Auto-dismiss
- Colors: Accent for success, error for failures

## 9. Page Max Widths

- Forms (login, register): `max-width: 480-500px`, centered
- Content pages: `max-width: 600-640px` (Contribute, Profile) or full width (Dashboard)
- Admin: full width with cards

## 10. Icons

- Library: `react-icons/fi` (Feather Icons)
- Size: 14-24px depending on context
- Color: Inherits text color or accent

## 11. 3D Background (Three.js)

- Rendered via `@react-three/fiber` Canvas
- Objects: Torus, Octahedron, Icosahedron, Torus Knot, Sphere
- Material: Glass-like (transparent, wireframe)
- Particle field (stars)
- Grid floor
- Auto-rotation with damping
- Fixed position behind all content (`position: fixed`, `z-index: 0`)
