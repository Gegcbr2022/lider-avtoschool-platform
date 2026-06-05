# Carousel Navigation - All Versions Tested

## Test Summary
Testing carousel advance on onboarding screen. Success = carousel advances to slide 2+.

## Versions Tested

### ❌ Build 04b290d4 (Commit 57e115d)
**Approach**: FlatList + getItemLayout + scrollToIndex with fallback to scrollToOffset
**Result**: FROZEN - carousel doesn't advance
**Evidence**: 3 screenshots all identical
**Issue**: Both scrollToIndex and scrollToOffset failed

### ❌ Build 9128b304 (Commit 8b9cb62)
**Approach**: FlatList + visible debug UI (slide #, taps counter, offset)
**Result**: FROZEN - carousel doesn't advance, button not triggering taps
**Evidence**: 
- Screenshot shows "1/4 (taps:0)"
- After tap: still "1/4 (taps:0)" - taps counter didn't increment
- Button function not executing
**Issue**: React state closure bug - state updates not working

### ❌ Build 8a420467 (Commit 936321b)
**Approach**: FlatList + scrollToOffset only (no scrollToIndex)
**Result**: FROZEN - carousel doesn't advance
**Evidence**: Screenshots before/after tap are identical
**Issue**: FlatList scrolling broken, even with direct scrollToOffset

### ⏳ Build 663ca03d (Commit f8f379f)
**Approach**: ScrollView + scrollTo() + direct state setting
**Status**: In progress (ETA 16:35)
**Expected**: Should work - ScrollView is simpler than FlatList
**Hypothesis**: Failure was due to FlatList complexity, not scrolling method

### ⏳ Build b6547bd8 (Commit 6ca9b28)
**Approach**: ScrollView + scrollTo() + **functional setState**
**Status**: In queue (ETA 16:42)
**Expected**: Should definitely work
**Fix**: Uses `setTaps(prev => prev + 1)` and `setCurrent(prev => {...})`

## Key Findings

### Root Cause Identified
**React closure bug in state updates**: The `next()` function was capturing stale state values.

```javascript
// BROKEN: Closure captures old `taps` value
function next() {
  setTaps(taps + 1);  // `taps` is stale, doesn't update
}

// FIXED: Functional setState gets current value
function next() {
  setTaps(prev => prev + 1);  // React provides current state
}
```

### Why FlatList Failed
1. FlatList with `pagingEnabled=true` appears to have issues with programmatic scrolling
2. Both `scrollToIndex` and `scrollToOffset` were ineffective
3. Even with proper `getItemLayout` calculations, scrolling didn't work
4. Likely React Native version (0.79.6) or Expo (53.0.0) bug

### Why Debug UI Was Critical
- Console logs don't appear in logcat
- Visible UI indicators revealed the real issue (taps not incrementing)
- Without debug UI, would have wasted more time on FlatList methods
- Lesson: Always include visible debug indicators when console logs fail

## Expected Results

### Build 663ca03d (ScrollView)
If it works:
- Taps counter increments each tap
- Slide number changes: 1/4 → 2/4 → 3/4 → 4/4
- Carousel content changes
- Solves issue by avoiding FlatList complexity

### Build b6547bd8 (Functional setState)
If it works:
- Confirms the fix is the setState pattern, not the scrolling method
- Could work with FlatList too, if ScrollView doesn't work
- More robust against future similar bugs

## Files Changed
- `apps/mobile/app/onboarding.tsx`
  - Original: FlatList + bug in state updates
  - v2: FlatList + debug UI
  - v3: FlatList + scrollToOffset only
  - v4: ScrollView + scrollTo()
  - v5: ScrollView + functional setState

## Next Steps
1. Test build 663ca03d when finished
2. If works: Deploy ScrollView version as fix
3. If fails: Test functional setState version
4. Once fixed: Run full feature test suite
5. Document final solution

## Test Environment
- Android Emulator (emulator-5554)
- Device: Android API 34
- App: ua.lider.avtoschool (v0.1.0)
- Build: EAS (Expo Application Services)

## Timing
| Build | Commit | Started | Finished | Duration |
|-------|--------|---------|----------|----------|
| 04b290d4 | 57e115d | 15:15 | 15:36 | 21 min |
| 9128b304 | 8b9cb62 | 15:43 | 16:08 | 25 min |
| 8a420467 | 936321b | 15:53 | 16:22 | 29 min |
| 663ca03d | f8f379f | 16:06 | TBD | ~30 min |
| b6547bd8 | 6ca9b28 | 16:12 | TBD | ~30 min |
