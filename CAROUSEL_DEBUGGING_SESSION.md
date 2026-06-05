# Carousel Navigation Bug - Debugging Session

## Problem
Onboarding carousel doesn't advance when user taps "Далі" button.

## ROOT CAUSE FOUND
**React closure issue in state updates**: The `next()` function was capturing stale `taps` value.
- Direct state: `setTaps(taps + 1)` captures old `taps` from closure
- Fixed with functional setState: `setTaps(prev => prev + 1)` gets current value

## Root Cause Investigation

### What We Tested
1. **Code Review** - getItemLayout prop is present, scrollToIndex with fallback implemented
2. **APK Testing** - Screenshots before/after taps show IDENTICAL images (carousel frozen)
3. **Console Logs** - Added `[Carousel]` debug messages, but they never appear in `adb logcat`

### Key Finding
React Native console.log() statements do NOT appear in standard Android logcat output, making remote debugging extremely difficult.

### What We Ruled Out
- ✅ Code not in the right place (verified in onboarding.tsx)
- ✅ Width calculations wrong (W is from Dimensions.get("window"))
- ✅ Styles incorrect (slide width is W, pagingEnabled is set)
- ❓ Button not being pressed (tap count visible in new builds could confirm/deny)
- ❓ scrollToIndex/scrollToOffset broken (likely - both failed)
- ❓ onScroll callback not firing (would prevent state updates)

## Solutions Tested

### Attempt 1: FlatList with scrollToIndex + fallback
```javascript
try {
  flatRef.current?.scrollToIndex({ index: nextIndex, animated: true, viewPosition: 0 });
} catch (e) {
  flatRef.current?.scrollToOffset({ offset, animated: true });
}
```
**Result**: FAILED - Carousel doesn't advance

### Attempt 2: FlatList with scrollToOffset only
```javascript
flatRef.current?.scrollToOffset({ offset: nextIndex * W, animated: true });
```
**Result**: FAILED - Carousel doesn't advance

### Attempt 3: ScrollView with scrollTo()
```javascript
scrollRef.current?.scrollTo({ x: offset, animated: true });
setCurrent(nextIndex);  // Set immediately, don't wait for onScroll
animateDot(nextIndex);
```
**Result**: PENDING - Build in progress

## Debug Artifacts Created
- `onboarding-alternative.tsx` - ScrollView implementation (fallback)
- Multiple debug UI indicators: tap count, slide number, scroll offset
- Test scripts and automation

## Builds in Progress
- Build 8a420467 (commit 936321b) - FlatList with scrollToOffset only - STUCK IN QUEUE
- Build 9128b304 (commit 8b9cb62) - FlatList with debug UI - STUCK IN QUEUE  
- Build f8f379f (commit with ScrollView) - SUBMITTED, awaiting EAS queue

## Next Steps
1. Test ScrollView-based carousel (simpler, more direct)
2. If ScrollView works → that's the fix
3. If ScrollView also fails → investigate whether it's pagingEnabled or a deeper issue

## Key Learnings
1. **Console logs invisible** - Can't use console.log for React Native debugging
2. **FlatList complexity** - getItemLayout + scrollToIndex might have bugs in React Native 0.79.6
3. **Visible UI better** - Added on-screen debug indicators (slide #, taps) instead of console logs
4. **ScrollView simpler** - No layout calculation needed, direct scrollTo() call
