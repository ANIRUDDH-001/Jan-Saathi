# Ved Avatar State Machine

## State Flow Diagram

```
                    ┌─────────────────┐
                    │                 │
                    │   INITIAL       │
                    │                 │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │                 │
                    │     IDLE        │◄──────────┐
                    │   (Default)     │           │
                    │                 │           │
                    └────────┬────────┘           │
                             │                    │
                 ┌───────────┼───────────┐        │
                 │           │           │        │
                 ▼           ▼           ▼        │
        ┌─────────────┐ ┌─────────┐ ┌─────────┐  │
        │             │ │         │ │         │  │
        │  LISTENING  │ │SPEAKING │ │PROCESSING│ │
        │             │ │         │ │         │  │
        └─────────────┘ └─────────┘ └─────────┘  │
                 │           │           │        │
                 └───────────┼───────────┘        │
                             │                    │
                             └────────────────────┘
```

## State Details

### IDLE (Default State)
**Entry Conditions**:
- No props set (all false)
- Component first mounts
- Any state is cancelled

**Visual**:
- Peaceful expression
- Closed smile
- Random eye blinks (every 3-5s)
- Breathing glow (hero variant only)

**Props**:
```tsx
<VedAvatar /> // No state props
```

**Transitions From**:
- Initial mount
- speaking={false}
- listening={false}
- processing={false}

---

### SPEAKING
**Entry Conditions**:
- `speaking={true}` prop is set
- TTS (Text-to-Speech) is active
- Ved is vocalizing response

**Visual**:
- Saffron pulse ring (#FF9933)
- Glow effect with box-shadow
- Mouth opens/closes (200ms intervals)
- Scale animation [1 → 1.08 → 1] (0.8s)

**Props**:
```tsx
<VedAvatar speaking={true} />
```

**Transitions From**:
- Idle
- Listening (override)
- Processing (override)

**Transitions To**:
- Idle (when speaking ends)

---

### LISTENING
**Entry Conditions**:
- `listening={true}` prop is set
- STT (Speech-to-Text) is waiting
- User is speaking

**Visual**:
- Softer saffron ring (50% opacity)
- Slower pulse [1 → 1.06 → 1] (1.5s)
- No mouth movement
- Alert expression

**Props**:
```tsx
<VedAvatar listening={true} />
```

**Transitions From**:
- Idle

**Transitions To**:
- Idle (when listening ends)
- Processing (when processing input)

**Note**: Speaking state overrides listening if both are true

---

### PROCESSING
**Entry Conditions**:
- `processing={true}` prop is set
- AI is "thinking"
- Backend is loading
- Form is generating

**Visual**:
- 80% opacity (desaturated)
- Rotating loading ring (saffron)
- Continuous 360° rotation (1s)
- No other animations

**Props**:
```tsx
<VedAvatar processing={true} />
```

**Transitions From**:
- Idle
- Listening (common flow)
- Speaking (less common)

**Transitions To**:
- Idle (when processing complete)
- Speaking (when starting to speak result)

---

## State Priority

When multiple states are set simultaneously:

```
processing > speaking > listening > idle
```

**Example**:
```tsx
// If both are true, processing takes precedence
<VedAvatar speaking={true} processing={true} />
// Result: Shows processing state only
```

---

## Common State Flows

### Voice Interaction Flow
```
IDLE → LISTENING → PROCESSING → SPEAKING → IDLE
  ↓        ↓            ↓           ↓         ↓
 User    User is     AI is      AI speaks  Complete
 taps    speaking   thinking    response
```

**Code**:
```tsx
const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');

// User taps voice button
setState('listening');

// User stops speaking
setState('processing');

// AI response ready
setState('speaking');

// Response complete
setState('idle');
```

### Chat Response Flow
```
IDLE → PROCESSING → IDLE
  ↓         ↓          ↓
User      AI is     Response
sends   thinking   rendered
```

**Code**:
```tsx
const [processing, setProcessing] = useState(false);

// User sends message
setProcessing(true);

// AI responds
setProcessing(false);
```

### Form Assistance Flow
```
IDLE → PROCESSING → SPEAKING → IDLE
  ↓         ↓           ↓          ↓
Form     Form is    Reading    Complete
 sent   generating   result
```

**Code**:
```tsx
const [step, setStep] = useState<'idle' | 'generating' | 'summary'>('idle');

<VedAvatar
  processing={step === 'generating'}
  speaking={step === 'summary'}
/>
```

---

## State Characteristics

| State | Duration | Repeating | Interruptible | Priority |
|-------|----------|-----------|---------------|----------|
| Idle | Indefinite | Yes (blinks) | Yes | Lowest |
| Listening | Variable | Yes (pulse) | Yes | Medium |
| Speaking | Variable | Yes (mouth) | Yes | High |
| Processing | Variable | Yes (spinner) | No | Highest |

---

## Animation Timings

| Animation | Duration | Easing | Repeat |
|-----------|----------|--------|--------|
| Breathing glow | 4s | easeInOut | Infinite |
| Eye blink | 150ms | - | Random 3-5s |
| Speaking pulse | 0.8s | easeInOut | Infinite |
| Mouth toggle | 200ms | - | While speaking |
| Listening pulse | 1.5s | easeInOut | Infinite |
| Processing spin | 1s | linear | Infinite |

---

## State Management Examples

### React State
```tsx
function VedInteraction() {
  const [vedState, setVedState] = useState({
    speaking: false,
    listening: false,
    processing: false,
  });

  return (
    <VedAvatar
      speaking={vedState.speaking}
      listening={vedState.listening}
      processing={vedState.processing}
    />
  );
}
```

### Derived State
```tsx
function ChatInterface() {
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  return (
    <VedAvatarSmall 
      processing={isTyping}
      speaking={isSpeaking}
    />
  );
}
```

### Context-Based
```tsx
function VedProvider() {
  const { vedState } = useVedContext();
  
  return (
    <VedAvatar
      speaking={vedState === 'speaking'}
      listening={vedState === 'listening'}
      processing={vedState === 'processing'}
    />
  );
}
```

---

## State Validation

### Valid Combinations
```tsx
// ✅ Single state
<VedAvatar speaking={true} />
<VedAvatar listening={true} />
<VedAvatar processing={true} />

// ✅ All false (idle)
<VedAvatar />

// ✅ Multiple states (priority applies)
<VedAvatar speaking={true} processing={true} /> // Shows processing
```

### Invalid/Redundant Combinations
```tsx
// ⚠️ Multiple states (priority applies, not recommended)
<VedAvatar speaking={true} listening={true} /> // Shows speaking

// ⚠️ Explicitly setting all false (redundant)
<VedAvatar speaking={false} listening={false} processing={false} /> // Same as <VedAvatar />
```

---

## Testing States

### Test Checklist
- [ ] Idle → Speaking transition is smooth
- [ ] Idle → Listening transition is smooth
- [ ] Idle → Processing transition is smooth
- [ ] Listening → Processing transition is smooth
- [ ] Processing → Speaking transition is smooth
- [ ] Speaking → Idle transition is smooth
- [ ] All transitions respect priority
- [ ] Animations loop correctly
- [ ] Mouth syncs with speaking state
- [ ] Eye blinks work in all states

### Test Code
```tsx
function StateTest() {
  const [state, setState] = useState<'idle' | 'speaking' | 'listening' | 'processing'>('idle');
  
  return (
    <div>
      <VedAvatar 
        speaking={state === 'speaking'}
        listening={state === 'listening'}
        processing={state === 'processing'}
      />
      
      <div>
        <button onClick={() => setState('idle')}>Idle</button>
        <button onClick={() => setState('listening')}>Listening</button>
        <button onClick={() => setState('processing')}>Processing</button>
        <button onClick={() => setState('speaking')}>Speaking</button>
      </div>
    </div>
  );
}
```

---

## State Best Practices

### ✅ Do
- Transition states sequentially when possible
- Clear states when interactions end
- Use appropriate state for context
- Test all state transitions
- Handle state cleanup on unmount

### ❌ Don't
- Rapidly toggle states (< 200ms)
- Leave states active indefinitely
- Mix unrelated states (speaking while listening)
- Forget to reset to idle
- Ignore state priority rules

---

## State Accessibility

- **Idle**: No ARIA updates needed
- **Speaking**: Should announce "Ved is speaking" to screen readers
- **Listening**: Should announce "Ved is listening" to screen readers
- **Processing**: Should announce "Ved is thinking" to screen readers

**Implementation**:
```tsx
<div role="status" aria-live="polite" aria-atomic="true">
  {processing && "Ved is thinking"}
  {speaking && "Ved is speaking"}
  {listening && "Ved is listening"}
</div>
```

---

**State Machine Version**: 1.0  
**Last Updated**: March 27, 2026  
**States**: 4 (Idle, Speaking, Listening, Processing)  
**Transitions**: All states ↔ Idle, with priority rules
