# UI/UX Design System

**Last Updated**: October 2025

Complete guide to the Ambé Wellness design system, including colors, typography, components, and styling conventions.

---

## Table of Contents

1. [Overview](#overview)
2. [Design Tokens](#design-tokens)
3. [Typography](#typography)
4. [Color System](#color-system)
5. [Components](#components)
6. [Layout System](#layout-system)
7. [Styling Conventions](#styling-conventions)
8. [Responsive Design](#responsive-design)
9. [Animations](#animations)

---

## Overview

The Ambé Wellness design system provides a consistent visual language across the platform, ensuring a cohesive user experience.

### Key Principles

1. **Simplicity**: Clean, minimal interfaces
2. **Accessibility**: WCAG 2.1 AA compliant
3. **Consistency**: Reusable components and patterns
4. **Responsiveness**: Mobile-first approach
5. **Performance**: Optimized assets and animations

---

## Design Tokens

**Location**: `src/lib/design-tokens.js:1`

### Color Tokens

```javascript
export const colors = {
  // Primary colors
  primary: {
    peach: '#FFD3AC',        // CTA/Static Links
    darkCharcoal: '#353535',  // Font color/Headings
  },

  // Neutral colors
  neutral: {
    background: '#E5E5E5',   // Page background
    white: '#FFFFFF',         // White elements
    bodyText: '#535353',      // Body text
    gridBox: '#F4F4F4',       // Grid/card backgrounds
  },
};
```

### Typography Tokens

```javascript
export const typography = {
  fonts: {
    heading: 'Richmond Text',              // H1 - 35px
    body: 'Basis Grotesque Arabic Pro',    // H2 & Paragraph
  },

  sizes: {
    h1: '35px',         // Richmond Text
    h2: '19px',         // Basis Grotesque Arabic Pro
    paragraph: '16px',  // Basis Grotesque Arabic Pro
  },
};
```

### Button Tokens

```javascript
export const buttons = {
  borderRadius: '9999px',  // Fully rounded
  padding: {
    x: '32px',
    y: '12px',
  },
  variants: {
    primary: {
      background: colors.primary.peach,
      color: colors.primary.darkCharcoal,
      hover: {
        background: colors.primary.darkCharcoal,
        color: colors.neutral.white,
      },
    },
  },
};
```

---

## Typography

### Font Families

#### Richmond Text (Heading Font)

Used for section titles and hero text.

```css
@font-face {
  font-family: 'Richmond';
  src: url('/fonts/Richmond-Text-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
}
```

**Weights Available**:
- Regular (400)
- Medium (500)
- SemiBold (600)
- Black (900)

**Fallback**: Playfair Display, serif

#### Basis Grotesque Arabic Pro (Body Font)

Used for body text, labels, and UI elements.

**Fallback**: System fonts
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

### Font Sizes

| Element | Size | Font | Usage |
|---------|------|------|-------|
| **H1** | 35px (text-4xl) | Richmond | Hero titles |
| **H2** | 19px (text-xl) | Richmond | Section headers |
| **Body** | 16px (text-base) | Basis Grotesque | Body text |
| **Small** | 14px (text-sm) | Basis Grotesque | Labels, captions |
| **Tiny** | 12px (text-xs) | Basis Grotesque | Footnotes |

### Typography Usage

**IMPORTANT**: Never use HTML heading tags (`<h1>`, `<h2>`, etc.). Always use `<div>` with Tailwind classes.

```javascript
// ❌ WRONG
<h1>Welcome to Ambé</h1>

// ✅ CORRECT
<div className="text-4xl font-richmond font-bold">Welcome to Ambé</div>
```

### Text Hierarchy

```javascript
// Hero/Primary Title
<div className="text-4xl lg:text-5xl font-richmond font-bold text-[#353535]">
  Integrative-Doctor led care
</div>

// Section Title
<div className="text-2xl font-richmond font-semibold text-[#353535]">
  The Ambé Difference
</div>

// Subsection Title
<div className="text-xl font-medium text-[#353535]">
  Our Approach
</div>

// Body Text
<p className="text-base text-[#535353] leading-relaxed">
  Experience personalized healthcare...
</p>

// Small Text
<p className="text-sm text-gray-600">
  Last updated: October 2025
</p>
```

---

## Color System

### Primary Palette

#### Peach (#FFD3AC)
- **Use**: CTAs, links, highlights
- **Hex**: #FFD3AC
- **Tailwind**: `bg-[#FFD3AC]`, `text-[#FFD3AC]`

#### Dark Charcoal (#353535)
- **Use**: Headings, body text
- **Hex**: #353535
- **Tailwind**: `bg-[#353535]`, `text-[#353535]`

### Neutral Palette

#### Background (#E5E5E5)
- **Use**: Page backgrounds
- **Hex**: #E5E5E5
- **Tailwind**: `bg-[#E5E5E5]`

#### Body Text (#535353)
- **Use**: Paragraph text
- **Hex**: #535353
- **Tailwind**: `text-[#535353]`

#### Grid Box (#F4F4F4)
- **Use**: Card backgrounds, containers
- **Hex**: #F4F4F4
- **Tailwind**: `bg-[#F4F4F4]`

#### White (#FFFFFF)
- **Use**: Text on dark backgrounds, cards
- **Hex**: #FFFFFF
- **Tailwind**: `bg-white`, `text-white`

### Semantic Colors

For dashboard/portal interfaces:

```javascript
// Success
className="bg-green-500 text-white"

// Warning
className="bg-yellow-500 text-gray-900"

// Error
className="bg-red-500 text-white"

// Info
className="bg-blue-500 text-white"
```

### Color Usage Guidelines

1. **Contrast**: Ensure 4.5:1 contrast ratio for text
2. **Consistency**: Use design tokens, not arbitrary colors
3. **Accessibility**: Test with color blindness simulators
4. **Hierarchy**: Use color to establish visual hierarchy

---

## Components

### Button Component

**Location**: `src/components/common/Button.jsx:1`

#### Variants

```javascript
// Primary Button
<Button variant="primary" onClick={handleClick}>
  Book Consultation
</Button>

// Light Button
<Button variant="light" onClick={handleClick}>
  Learn More
</Button>

// Full Width
<Button variant="primary" fullWidth>
  Subscribe Now
</Button>

// Disabled
<Button disabled>
  Coming Soon
</Button>
```

#### Implementation

```javascript
export default function Button({
  onClick,
  children,
  disabled,
  variant = 'primary',
  fullWidth = false,
  className = '',
  type = 'button'
}) {
  const baseStyles = 'px-20 py-3 rounded-full font-medium transition-all duration-200';

  const variantStyles = {
    primary: `bg-[#FFD3AC] text-[#353535] hover:bg-[#353535] hover:text-white`,
    light: `bg-[#FFD3AC] text-[#353535] hover:bg-white hover:text-[#353535]`,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}
```

### TextField Component

**Location**: `src/components/common/TextField.jsx:1`

```javascript
<TextField
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
  placeholder="your@email.com"
/>
```

### VideoBackground Component

**Location**: `src/components/common/VideoBackground.jsx:1`

```javascript
<VideoBackground videoSrc="/videos/hero.mp4">
  <div className="text-white">
    <div className="text-5xl font-bold">Hero Title</div>
    <p className="text-xl mt-4">Subtitle text</p>
  </div>
</VideoBackground>
```

### Navigation Components

#### UserNav

**Location**: `src/components/navigation/UserNav.jsx:1`

User-specific navigation with links to:
- Dashboard
- Consultations
- Store
- Messages
- Profile

#### DoctorNav

**Location**: `src/components/navigation/DoctorNav.jsx:1`

Doctor-specific navigation with links to:
- Dashboard
- Consultations
- Users
- Messages
- Schedule
- Profile

### Footer Component

**Location**: `src/components/common/Footer.jsx:1`

```javascript
<Footer>
  {/* Footer content with video background */}
</Footer>
```

### Protected Route Component

**Location**: `src/components/common/ProtectedRoute.jsx:1`

```javascript
<ProtectedRoute userType="user">
  {/* Protected content */}
</ProtectedRoute>
```

---

## Layout System

### Container

Maximum width container:

```javascript
<div className="max-w-7xl mx-auto px-8 lg:px-16">
  {/* Content */}
</div>
```

**Breakpoints**:
- `max-w-7xl`: 1280px
- `px-8`: Mobile padding (32px)
- `lg:px-16`: Desktop padding (64px)

### Grid System

```javascript
// Two columns
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

// Three columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>

// Four columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {items.map(item => (
    <div key={item.id}>{item.content}</div>
  ))}
</div>
```

### Spacing

Standard spacing scale:

| Value | Pixels | Usage |
|-------|--------|-------|
| `p-2` | 8px | Tight spacing |
| `p-4` | 16px | Default spacing |
| `p-6` | 24px | Medium spacing |
| `p-8` | 32px | Large spacing |
| `py-20` | 80px top/bottom | Section padding |

### Cards

```javascript
<div className="bg-white rounded-lg shadow-md p-6">
  <div className="text-xl font-semibold mb-4">Card Title</div>
  <p className="text-gray-600">Card content</p>
</div>
```

---

## Styling Conventions

### Tailwind CSS

The project uses **Tailwind CSS v4** for styling.

#### Arbitrary Values

When design tokens aren't in Tailwind's default palette:

```javascript
// Colors
className="bg-[#FFD3AC] text-[#353535]"

// Sizes
className="w-[450px] h-[300px]"
```

#### Responsive Modifiers

```javascript
className="text-base md:text-lg lg:text-xl"
//          Mobile    Tablet    Desktop
```

#### State Modifiers

```javascript
className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50"
```

### Class Organization

Order classes logically:

```javascript
className="
  // Layout
  flex items-center justify-between
  // Sizing
  w-full h-12
  // Spacing
  px-4 py-2 mb-4
  // Colors
  bg-white text-gray-900
  // Border
  border border-gray-300 rounded-lg
  // Effects
  shadow-md hover:shadow-lg
  // Transitions
  transition-all duration-200
"
```

### Global Styles

**Location**: `src/app/globals.css:1`

```css
:root {
  --ambe-peach: #FFD3AC;
  --ambe-charcoal: #353535;
  --ambe-background: #E5E5E5;
  --ambe-white: #FFFFFF;
  --ambe-body: #535353;
  --ambe-grid: #F4F4F4;
}

body {
  background: var(--ambe-background);
  color: var(--ambe-charcoal);
  font-size: 16px;
  line-height: 1.5;
}
```

---

## Responsive Design

### Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Small devices |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Approach

```javascript
// Starts with mobile, scales up
<div className="
  text-2xl     // Mobile
  md:text-3xl  // Tablet
  lg:text-4xl  // Desktop
">
  Responsive Text
</div>
```

### Hide/Show on Different Screens

```javascript
// Hide on mobile, show on desktop
<div className="hidden lg:block">
  Desktop Only
</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">
  Mobile Only
</div>
```

---

## Animations

### Framer Motion

Used for smooth animations.

```bash
npm install framer-motion
```

### Basic Animation

```javascript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Animated Content
</motion.div>
```

### Stagger Children

```javascript
<motion.div
  variants={{
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0 }
      }}
    >
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Hover Animations

```javascript
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  Hover Me
</motion.button>
```

### Loading Spinners

```javascript
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
```

---

## Icons

### Heroicons

The project uses Heroicons for all icons.

```bash
npm install @heroicons/react
```

### Usage

```javascript
import {
  CalendarIcon,
  UserIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

// Outline icons (default)
<CalendarIcon className="h-6 w-6 text-gray-600" />

// Solid icons
import { CheckCircleIcon } from '@heroicons/react/24/solid';
<CheckCircleIcon className="h-6 w-6 text-green-500" />
```

---

## Best Practices

### 1. Consistency

Always use design tokens and reusable components.

### 2. Accessibility

- Maintain color contrast ratios
- Include alt text for images
- Use semantic HTML (with divs for headings)
- Keyboard navigable

### 3. Performance

- Optimize images (use Next.js Image component)
- Lazy load below-the-fold content
- Minimize animation complexity

### 4. Maintainability

- Keep components small and focused
- Document component props
- Use TypeScript (future enhancement)

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Heroicons](https://heroicons.com/)
- [Design Tokens](./src/lib/design-tokens.js)

---

**Design system documentation complete!**
