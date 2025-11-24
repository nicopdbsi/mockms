# BentoHub Design Guidelines

## Design Approach
**Reference-Based Approach** inspired by modern SaaS leaders (Notion, Linear, Stripe) with food-industry warmth. Clean, professional, and trust-building for small food entrepreneurs who need clarity and confidence.

## Typography System
- **Headings**: Inter or DM Sans - Bold (700) for impact
  - Hero H1: 3.5rem desktop / 2.25rem mobile
  - Section H2: 2.5rem desktop / 1.875rem mobile  
  - Feature H3: 1.5rem desktop / 1.25rem mobile
- **Body**: Inter Regular (400) at 1.125rem with 1.75 line-height
- **Accents**: Medium (500) weight for CTAs and emphasis

## Layout System
**Tailwind spacing primitives**: 4, 6, 8, 12, 16, 20, 24, 32
- Section padding: py-20 desktop / py-12 mobile
- Component spacing: gap-8 for grids, gap-6 for cards
- Container: max-w-7xl mx-auto px-6

## Page Structure (7 Sections)

### 1. Hero Section (90vh)
- **Layout**: Single column, centered content with max-w-4xl
- **Elements**: 
  - Headline "STOP GUESSING. START EARNING." (largest text)
  - Subtitle explaining subscription-based Kitchen Management System
  - Dual CTAs: "Start Free Trial" (primary) + "Watch Demo" (secondary with blurred background)
  - Trust indicator: "Join 500+ food entrepreneurs" with small avatars
- **Background**: Large hero image of professional kitchen or food entrepreneur at work

### 2. Three-Pillar Showcase
- **Layout**: 3-column grid (lg:grid-cols-3, md:grid-cols-1)
- **Cards** with generous padding (p-8):
  - Large icon (h-12 w-12) for LAUNCH/MANAGE/GROW
  - "CFO/COO/CGO" subtitle in medium weight
  - Feature title (bold)
  - 2-3 sentence description
  - Hover elevation effect

### 3. Problem/Solution Section
- **Layout**: 2-column alternating (image-text, text-image)
- **Content**: 
  - Left: "The Guessing Game Stops Here" with pain points list
  - Right: Product screenshot or kitchen workspace image
- Reverse layout for second row showing solution benefits

### 4. Feature Deep-Dive
- **Layout**: Single column with max-w-5xl
- **Elements**: Each of 3 features gets:
  - Large feature image/screenshot (aspect-video)
  - Feature title + detailed description
  - 3-4 bullet benefits with checkmark icons (Heroicons)
  - Stacked vertically with space-y-16

### 5. Social Proof & Results
- **Layout**: 3-column grid for stats, 2-column for testimonials
- **Stats Cards**: 
  - Large number (text-5xl)
  - Metric label below
  - Subtle icon accent
- **Testimonials**: 
  - Customer photo (rounded-full, h-16 w-16)
  - Quote in italics
  - Name, business, location

### 6. Pricing/CTA Section
- **Layout**: Centered with max-w-2xl
- **Elements**:
  - "Ready to Transform Your Kitchen?" headline
  - Subscription value prop (3-4 bullets)
  - Large primary CTA
  - Money-back guarantee badge
  - "No credit card required" text

### 7. Rich Footer
- **Layout**: 4-column grid (logo/product/company/contact)
- **Elements**:
  - Newsletter signup form
  - Quick links navigation
  - Social media icons (Heroicons)
  - Contact info with response time
  - Trust badges (SSL, payment security)

## Component Library

**Buttons**:
- Primary: Rounded-lg, py-3 px-8, bold text, shadow-lg
- Secondary: Rounded-lg, py-3 px-8, border-2, backdrop-blur-sm (for image overlays)

**Cards**:
- Rounded-xl borders with p-6 to p-8
- Subtle shadow with hover:shadow-xl transition
- White/light backgrounds for contrast

**Icons**: Heroicons (outline style for features, solid for CTAs)

**Form Inputs**:
- Rounded-lg with py-3 px-4
- Clear labels above inputs
- Validation states with color-neutral feedback

## Images

**Hero Image**: 
- Full-width background image showing professional food entrepreneur in modern kitchen setting
- Image should convey professionalism, organization, success
- Apply subtle overlay (opacity-20 to opacity-40) for text readability
- Position: background, cover, center

**Feature Images**:
- Product screenshots showing dashboard interfaces
- Real kitchen workspace photos showing before/after organization
- Food products with pricing labels (demonstrating the value)
- Aspect ratio: 16:9 for consistency

**Customer Photos**:
- Authentic food entrepreneur headshots for testimonials
- Circular crop (rounded-full)
- Size: 64px × 64px

**Trust/Social Proof**:
- Small customer avatar grid in hero (32px × 32px each)
- Partner/certification logos if applicable

## Animations
**Minimal & Purposeful**:
- Fade-in on scroll for feature cards
- Smooth hover state transitions (200ms ease)
- NO background animations or distracting motion

## Accessibility
- Clear focus states on all interactive elements
- Semantic HTML hierarchy (proper heading levels)
- Alt text for all images describing context
- Sufficient contrast ratios throughout
- Form labels properly associated

**Key Design Principle**: Professional clarity meets entrepreneurial warmth—every element builds trust and demonstrates value without overwhelming the busy food entrepreneur.