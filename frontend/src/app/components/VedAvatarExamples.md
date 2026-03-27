# Ved Avatar Component - Usage Guide

## Overview
The Ved avatar is the friendly face of Jan Saathi, representing "Ved" - the AI companion that helps citizens discover government schemes. This component comes with responsive sizing, micro-interactions, and state-based animations.

## Component Variants

### 1. Main VedAvatar Component
The primary avatar component with full customization options.

```tsx
import { VedAvatar } from './components/VedAvatar';

// Hero section (160px, scales to 120px on mobile)
<VedAvatar 
  size={160} 
  variant="hero"
  speaking={isVedSpeaking}
  listening={isListening}
  processing={isProcessing}
  showLabel={true}
  showPlatform={true}
/>

// Custom size
<VedAvatar 
  size={80} 
  speaking={false}
  processing={true}
/>
```

**Props:**
- `size?: number` - Avatar size in pixels (default: 220)
- `speaking?: boolean` - Shows pulse animation with saffron glow
- `listening?: boolean` - Shows softer pulse animation
- `processing?: boolean` - Shows loading spinner with desaturation
- `showLabel?: boolean` - Displays "वेद" label below avatar
- `showPlatform?: boolean` - Adds platform glow effect
- `variant?: 'hero' | 'chat' | 'profile'` - Preset size configurations

### 2. VedAvatarSmall (32px)
Optimized for chat bubbles and inline use.

```tsx
import { VedAvatarSmall } from './components/VedAvatar';

// In chat message
<div className="flex items-center gap-2">
  <VedAvatarSmall speaking={message.isSpeaking} />
  <div>Message content</div>
</div>

// With processing state
<VedAvatarSmall processing={true} />
```

**Props:**
- `speaking?: boolean` - Pulse animation
- `processing?: boolean` - Loading state

### 3. VedAvatarProfile (64px)
Perfect for profile pages and sidebars.

```tsx
import { VedAvatarProfile } from './components/VedAvatar';

// Profile header
<div className="flex items-center gap-4">
  <VedAvatarProfile speaking={false} />
  <div>
    <h1>User Name</h1>
    <p>Email</p>
  </div>
</div>
```

**Props:**
- `speaking?: boolean` - Pulse animation
- `processing?: boolean` - Loading state

## Responsive Behavior

### Size Guidelines

| Context | Size | Component | Notes |
|---------|------|-----------|-------|
| Hero Section (Desktop) | 160px | `VedAvatar` | Full size with glow effects |
| Hero Section (Mobile) | 120px | `VedAvatar` | Auto-scales on screens < 768px |
| Profile Sidebar | 64px | `VedAvatarProfile` | Clean and compact |
| Chat Bubble | 32px | `VedAvatarSmall` | Minimal footprint |
| Form Assistance | 80-100px | `VedAvatar` | Medium size for guidance |

### Mobile Optimization
The hero variant automatically adjusts size on mobile devices:
- Desktop (≥768px): Full `size` prop value
- Mobile (<768px): Scales down to 120px for hero variant

## Micro-Interactions

### 1. Speaking State
When Ved is speaking (TTS active):
- **Saffron pulse ring** with 2px border
- **Glow effect** with box-shadow
- **Scale animation**: [1 → 1.08 → 1] over 0.8s
- **Mouth animation**: Opens and closes every 200ms

```tsx
<VedAvatar speaking={true} size={160} />
```

### 2. Listening State
When waiting for user input (STT active):
- **Softer saffron ring** (50% opacity)
- **Slower pulse**: [1 → 1.06 → 1] over 1.5s
- No mouth movement

```tsx
<VedAvatar listening={true} size={160} />
```

### 3. Processing State
When Ved is "thinking" or loading:
- **80% opacity** and **desaturation**
- **Rotating loading ring** (saffron, 360° rotation)
- Smooth 0.3s transition

```tsx
<VedAvatar processing={true} size={160} />
```

### 4. Idle State
Default peaceful state:
- **Breathing glow** effect (hero variant only)
- **Random eye blinks** every 3-5 seconds
- **Gentle smile** (closed mouth)

```tsx
<VedAvatar size={160} />
```

## Color Palette
All animations use Jan Saathi brand colors:
- **Saffron**: `#FF9933` (Primary, active states)
- **Green**: `#138808` (Success, listening ring)
- **Navy Blue**: `#000080` (Background for small avatar)
- **White**: `#FFFFFF` (Kurta, highlights)

## Usage Examples

### Example 1: VedEntry Screen
```tsx
import { VedAvatar } from './components/VedAvatar';

function VedEntry() {
  const [vedState, setVedState] = useState<'idle' | 'speaking' | 'listening'>('idle');

  return (
    <div className="flex flex-col items-center">
      <VedAvatar
        size={180}
        speaking={vedState === 'speaking'}
        listening={vedState === 'listening'}
        showLabel={true}
        variant="hero"
      />
    </div>
  );
}
```

### Example 2: Chat Interface
```tsx
import { VedAvatarSmall } from './components/VedAvatar';

function ChatMessage({ message, isSpeaking }) {
  return (
    <div className="flex gap-2">
      <VedAvatarSmall speaking={isSpeaking} />
      <div className="bg-muted rounded-lg p-3">
        {message.text}
      </div>
    </div>
  );
}
```

### Example 3: Profile Page
```tsx
import { VedAvatarProfile } from './components/VedAvatar';

function ProfileHeader({ user }) {
  return (
    <div className="flex items-center gap-4">
      <VedAvatarProfile />
      <div>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
    </div>
  );
}
```

### Example 4: Form Assistance
```tsx
import { VedAvatar } from './components/VedAvatar';

function FormSidebar({ step }) {
  const isProcessing = step === 'generating';
  
  return (
    <div className="text-center">
      <VedAvatar 
        size={100} 
        processing={isProcessing}
        speaking={step === 'summary'}
      />
      <p className="mt-4">
        {isProcessing ? 'Ved is processing...' : 'Ved is here to help'}
      </p>
    </div>
  );
}
```

## Accessibility

- All avatar components use semantic SVG markup
- Animations respect `prefers-reduced-motion` when possible
- Proper ARIA labels should be added in parent components
- Color contrast meets WCAG AA standards

## Performance Notes

- SVG-based (no image requests)
- Optimized animations using `motion/react`
- No layout shift (fixed dimensions)
- Lazy animations (only active states)

## Future Enhancements

Potential additions for the avatar system:
1. **Emotion states**: Happy, concerned, celebrating
2. **Hand gestures**: Pointing, waving, thumbs up
3. **Accessories**: Different turbans, seasonal decorations
4. **Voice visualization**: Waveform integration
5. **Cultural variants**: Regional attire options

## Brand Consistency

The Ved avatar is a core brand element of Jan Saathi. Always maintain:
- Consistent color usage (tricolor theme)
- Friendly, approachable expression
- Professional yet warm demeanor
- Cultural authenticity (Indian traditional elements)

---

For questions or contributions, refer to the main Jan Saathi design system documentation.
