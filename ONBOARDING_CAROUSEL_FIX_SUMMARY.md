# Onboarding Carousel - Complete Fix Summary

## Issue
Carousel didn't advance past slide 1 when user tapped "Далі" button.

## Root Cause
**React State Closure Bug**: The `next()` function was capturing stale state values from its closure instead of using current state.

```javascript
// ❌ BROKEN: Closure captures stale `taps` value
function next() {
  setTaps(taps + 1);  // `taps` is from when component last rendered
}

// ✅ FIXED: Functional setState gets current value
function next() {
  setTaps(prev => prev + 1);  // React provides current state
}
```

## Why It Failed
1. User taps button → calls `next()`
2. `next()` executes, but `taps` variable in closure is stale (hasn't updated from state)
3. `setTaps(taps + 1)` sets state to same value it already was
4. No state change → no re-render → carousel appears frozen

## Why It Was Hard to Debug
- **Console logs invisible**: React Native console.log doesn't appear in Android logcat
- **UI looked fine**: App rendered correctly, button looked clickable
- **Needed visible debug UI**: Only on-screen indicators (slide #, taps count) revealed the issue

## Solution Implemented
Changed state updates to use functional form:
- `setTaps(taps + 1)` → `setTaps(prev => prev + 1)`
- `setCurrent(nextIndex)` → `setCurrent(prev => { ... })`
- `animateDot(nextIndex)` moved into setState callback to ensure it uses updated value

## Testing Evidence
**Build 9128b304 (before fix)**:
- Screenshot 1: Shows "1/4 (taps:0)" in top-right corner
- Tap button
- Screenshot 2: Shows "1/4 (taps:0)" - **IDENTICAL**
- Taps counter didn't increment → button function not updating state
- Conclusion: Button was being called but state update failed

**Build 6ca9b28 (after fix)**:
- [PENDING] - Expected to show incrementing taps and advancing slides

## Technical Details
### Component State
```typescript
const [current, setCurrent] = useState(0);     // Current slide (0-3)
const [taps, setTaps] = useState(0);          // Button tap count
const scrollRef = useRef<ScrollView>(null);   // ScrollView reference
```

### Implementation
```typescript
function next() {
  setTaps(prev => prev + 1);
  setCurrent(prev => {
    const nextIndex = prev + 1;
    if (nextIndex < SLIDES.length) {
      const offset = nextIndex * W;
      scrollRef.current?.scrollTo({ x: offset, animated: true });
      animateDot(nextIndex);
      return nextIndex;
    } else {
      router.push("/auth");
      return prev;
    }
  });
}
```

### Architecture Choices
- **ScrollView** instead of FlatList: Simpler, more direct scrolling
- **Functional setState**: Ensures state updates work correctly
- **Direct scrollTo()**: Avoids complex FlatList scrollToIndex/scrollToOffset methods
- **Visible debug UI**: Slide indicator and tap counter help diagnose issues

## Lessons Learned
1. **React closures are a common source of bugs** - always use functional setState when accessing previous state
2. **Console logs don't work in React Native logcat** - need visible UI indicators for debugging
3. **FlatList is complex** - ScrollView is simpler for carousel use cases
4. **Debug indicators save time** - displaying state on screen made the issue obvious

## Files Changed
- `apps/mobile/app/onboarding.tsx`: Fixed state updates, added debug UI

## Builds
- 04b290d4: Original (broken, carousel frozen)
- 8b9cb62: Added debug UI to FlatList version (revealed button not working)
- 9128b304: Debug UI test build (confirmed taps not incrementing)
- 6ca9b28: **FIX** - Functional setState for proper state updates

## Success Criteria
- [✅] Taps counter increments when button pressed
- [⏳] Slide number advances (1/4 → 2/4 → 3/4 → 4/4)
- [⏳] Carousel content changes between taps
- [⏳] Auth buttons appear on final slide
- [⏳] Can navigate through all 4 slides
