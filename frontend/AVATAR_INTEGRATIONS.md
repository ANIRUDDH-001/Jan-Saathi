# Ved Avatar Integration Points

This document lists all locations where the Ved Avatar is currently integrated in the Jan Saathi application.

## Component Exports

**File**: `/src/app/components/VedAvatar.tsx`

```tsx
export function VedAvatar({ ... })          // Main component
export function VedAvatarSmall({ ... })     // 32px variant
export function VedAvatarProfile({ ... })   // 64px variant
```

## Integration Locations

### 1. VedEntry Screen
**File**: `/src/app/pages/VedEntry.tsx`  
**Route**: `/ved`

**Usage**:
```tsx
<VedAvatar
  size={180}
  speaking={vedState === 'speaking'}
  listening={vedState === 'listening'}
  processing={vedState === 'processing'}
  showLabel={true}
  showPlatform={true}
/>
```

**Purpose**: Main entry screen where Ved introduces himself  
**Features**: All states (idle, speaking, listening, processing), with label

---

### 2. Chat Page - Bot Messages
**File**: `/src/app/pages/Chat.tsx`  
**Route**: `/chat`

**Usage**:
```tsx
{msg.role === 'bot' && (
  <div className="flex items-center gap-2 mb-2">
    <VedAvatarSmall />
    <button className="volume-button">
      <Volume2 className="w-4 h-4" />
    </button>
  </div>
)}
```

**Purpose**: Shows Ved's avatar next to bot responses  
**Features**: Static avatar (32px) in chat bubble

---

### 3. Chat Page - Typing Indicator
**File**: `/src/app/pages/Chat.tsx`  
**Route**: `/chat`

**Usage**:
```tsx
{typing && (
  <div className="flex items-center gap-3">
    <VedAvatarSmall processing={true} />
    <div className="bouncing-dots">...</div>
  </div>
)}
```

**Purpose**: Shows Ved is processing/thinking  
**Features**: Processing state with loading animation (32px)

---

### 4. Track Page - Progress Indicator
**File**: `/src/app/pages/Track.tsx`  
**Route**: `/track`

**Usage**:
```tsx
{isCurrent && (
  <motion.div className="absolute -top-5">
    <VedAvatarSmall />
  </motion.div>
)}
```

**Purpose**: Marks current stage in application tracking  
**Features**: Static marker (32px), animated entry

---

### 5. Profile Page - User Header
**File**: `/src/app/pages/Profile.tsx`  
**Route**: `/profile`

**Usage**:
```tsx
<div className="flex items-center gap-4">
  <VedAvatarProfile />
  <div>
    <h1>{user?.name}</h1>
    <p>{user?.email}</p>
  </div>
</div>
```

**Purpose**: Professional avatar in profile header  
**Features**: Static avatar (64px), clean design

---

### 6. AgriFormFill Page - Sidebar
**File**: `/src/app/pages/AgriFormFill.tsx`  
**Route**: `/form-fill`

**Usage**:
```tsx
<VedAvatar 
  size={100} 
  speaking={step === 'summary' || step === 'generating'} 
/>
```

**Purpose**: Shows Ved assisting with form filling  
**Features**: Speaking state, medium size (100px)

---

### 7. AgriFormFill Page - Generating State
**File**: `/src/app/pages/AgriFormFill.tsx`  
**Route**: `/form-fill`

**Usage**:
```tsx
<VedAvatar size={120} speaking />
```

**Purpose**: Large avatar during PDF generation  
**Features**: Speaking animation, larger size (120px)

---

### 8. GoodbyeSummary Component
**File**: `/src/app/components/GoodbyeSummary.tsx`  
**Used in**: Chat page (session end modal)

**Usage**:
```tsx
<VedAvatar size={80} showPlatform />
```

**Purpose**: Shows Ved in goodbye/summary modal  
**Features**: Platform glow effect (80px)

---

### 9. Avatar Showcase Page (Dev/Demo)
**File**: `/src/app/pages/VedAvatarShowcase.tsx`  
**Route**: `/avatar-showcase`

**Purpose**: Interactive demo showing all avatar variants and states  
**Features**: All sizes (32px - 160px), all states, interactive controls

---

## Import Statements by File

### Pages
```tsx
// VedEntry.tsx
import { VedAvatar } from '../components/VedAvatar';

// Chat.tsx
import { VedAvatarSmall } from '../components/VedAvatar';

// Track.tsx
import { VedAvatarSmall } from '../components/VedAvatar';

// Profile.tsx
import { VedAvatarProfile } from '../components/VedAvatar';

// AgriFormFill.tsx
import { VedAvatar } from '../components/VedAvatar';

// VedAvatarShowcase.tsx
import { VedAvatar, VedAvatarSmall, VedAvatarProfile } from '../components/VedAvatar';
```

### Components
```tsx
// GoodbyeSummary.tsx
import { VedAvatar } from './VedAvatar';
```

---

## Usage Summary

| Component | Count | Sizes Used | States Used | Notes |
|-----------|-------|------------|-------------|-------|
| VedAvatar | 5 | 80px, 100px, 120px, 160px, 180px | All | Full-featured |
| VedAvatarSmall | 3 | 32px | processing | Chat & tracking |
| VedAvatarProfile | 1 | 64px | none | Profile only |

---

## State Usage Across App

| State | Where Used | Purpose |
|-------|------------|---------|
| **Idle** | All locations | Default peaceful state |
| **Speaking** | VedEntry, AgriFormFill | Voice output active |
| **Listening** | VedEntry | Voice input active |
| **Processing** | VedEntry, Chat (typing) | AI thinking/loading |

---

## Not Yet Integrated

Potential future integration points:

1. **Landing Page Hero** - Could show Ved in hero section
2. **Schemes Page** - Could show Ved as helper icon
3. **SchemeDetail Page** - Could show Ved explaining scheme
4. **Admin Dashboard** - Could show Ved in stats summary
5. **Error Pages** - Could show Ved in 404/error states

---

## Component Props Usage

### Most Common Configurations

**Hero/Entry (Large)**:
```tsx
<VedAvatar 
  size={160-180} 
  variant="hero"
  speaking={...}
  showLabel={true}
/>
```

**Form Helper (Medium)**:
```tsx
<VedAvatar 
  size={80-100} 
  speaking={...}
  processing={...}
/>
```

**Chat Message (Small)**:
```tsx
<VedAvatarSmall />
```

**Profile (Medium-Small)**:
```tsx
<VedAvatarProfile />
```

---

## Testing Checklist

When making changes to VedAvatar, test these integration points:

- [ ] VedEntry - All states transition smoothly
- [ ] Chat - Bot messages show avatar correctly
- [ ] Chat - Typing indicator shows processing state
- [ ] Track - Avatar appears on current stage
- [ ] Profile - Avatar renders in header
- [ ] AgriFormFill - Avatar shows in sidebar
- [ ] AgriFormFill - Large avatar in generating state
- [ ] GoodbyeSummary - Avatar appears in modal
- [ ] Avatar Showcase - All demos work

---

## Performance Notes

- **Total instances**: ~8-10 avatars can be on screen simultaneously (rare)
- **Typical load**: 1-3 avatars per page
- **Render cost**: Minimal (SVG-based)
- **Animation cost**: Low (GPU-accelerated transforms)

---

## Maintenance Tips

### When updating the avatar:
1. Update VedAvatar.tsx (main component)
2. Test in Avatar Showcase (/avatar-showcase)
3. Verify all 9 integration points above
4. Check responsive behavior on mobile
5. Update documentation if props change

### When adding new integration:
1. Choose appropriate variant (VedAvatar, Small, or Profile)
2. Determine required states
3. Add to this document
4. Test state transitions
5. Verify responsive behavior

---

**Last Updated**: March 27, 2026  
**Total Integration Points**: 9  
**Components Used**: 3 variants  
**States Implemented**: 4 (idle, speaking, listening, processing)
