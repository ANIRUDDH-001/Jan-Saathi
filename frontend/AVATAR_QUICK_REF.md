# Ved Avatar - Quick Reference

## Import
```tsx
import { VedAvatar, VedAvatarSmall, VedAvatarProfile } from './components/VedAvatar';
```

## Basic Usage

### Hero/Landing Page
```tsx
<VedAvatar 
  size={160} 
  variant="hero"
  speaking={isVedSpeaking}
  showLabel={true}
/>
```

### Chat Bubble
```tsx
<VedAvatarSmall speaking={message.isAI && isSpeaking} />
```

### Profile Header
```tsx
<VedAvatarProfile processing={isLoading} />
```

### Form Assistance
```tsx
<VedAvatar 
  size={100} 
  processing={step === 'generating'}
  speaking={step === 'summary'}
/>
```

## Props Quick Reference

### VedAvatar
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | number | 220 | Avatar size in pixels |
| variant | 'hero' \| 'chat' \| 'profile' | 'hero' | Context preset |
| speaking | boolean | false | Pulse + mouth animation |
| listening | boolean | false | Soft pulse animation |
| processing | boolean | false | Loading ring + desaturation |
| showLabel | boolean | false | Show "वेद" label |
| showPlatform | boolean | false | Platform glow effect |

### VedAvatarSmall & VedAvatarProfile
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| speaking | boolean | false | Pulse animation |
| processing | boolean | false | Loading state |

## States Cheat Sheet

```tsx
// 🟢 Idle (peaceful, breathing)
<VedAvatar />

// 🔊 Speaking (Ved is talking)
<VedAvatar speaking={true} />

// 👂 Listening (Ved is waiting)
<VedAvatar listening={true} />

// ⏳ Processing (Ved is thinking)
<VedAvatar processing={true} />
```

## Size Guidelines

| Use Case | Size | Component |
|----------|------|-----------|
| Chat bubble | 32px | VedAvatarSmall |
| Profile sidebar | 64px | VedAvatarProfile |
| Form helper | 80-100px | VedAvatar |
| Mobile hero | 120px | VedAvatar variant="hero" |
| Desktop hero | 160px | VedAvatar variant="hero" |

## Common Patterns

### Chat Message with Ved
```tsx
<div className="flex gap-2">
  <VedAvatarSmall />
  <div className="message-bubble">
    {message.text}
  </div>
</div>
```

### Typing Indicator
```tsx
{isTyping && (
  <div className="flex items-center gap-3">
    <VedAvatarSmall processing={true} />
    <div className="bouncing-dots">...</div>
  </div>
)}
```

### Voice Interaction
```tsx
<VedAvatar 
  size={180}
  speaking={voiceState === 'speaking'}
  listening={voiceState === 'listening'}
  processing={voiceState === 'processing'}
/>
```

## Brand Colors
- Saffron: `#FF9933` - Active states, pulse rings
- Green: `#138808` - Success, listening
- Navy: `#000080` - Background
- White: `#FFFFFF` - Kurta, highlights

## Animation Timing
- Speaking pulse: 0.8s
- Listening pulse: 1.5s
- Processing spin: 1.0s
- Eye blink: 150ms (every 3-5s)
- Mouth toggle: 200ms

## Demo Page
Visit `/avatar-showcase` to see all variants and states in action.

## Full Documentation
See `/src/app/components/VedAvatarExamples.md` for complete guide.
