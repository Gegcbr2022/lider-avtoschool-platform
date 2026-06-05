# 🎯 PRIORITY ROADMAP — What Needs to Happen Next

**Date:** 2026-06-05 18:00 UTC  
**Current Blocker:** Carousel bug  
**Current Status:** EAS build queued  

---

## P0 - CRITICAL (Blocks Everything)

### P0.1 Fix Carousel Navigation
**Status:** 🔄 IN PROGRESS  
**What:** Carousel doesn't advance to next slide  
**Why:** User stuck on onboarding, app is unusable  
**Solution:** 
1. Test with debug logs when APK ready
2. Identify failure point
3. Use scrollToOffset if scrollToIndex fails
4. Rebuild and verify

**Timeline:** 1-2 hours  
**Owner:** Dev  
**Blocker For:** Everything else

---

## P1 - HIGH (Needed for v10-alpha)

### P1.1 Test All Carousel Slides
**When:** After carousel tap works  
**What:** Verify slide 1→2→3→4 all transition  
**Duration:** 10 minutes  
**Acceptance:** All slides advance smoothly

### P1.2 Test Auth Screen
**When:** After carousel complete  
**What:** Verify buttons on final slide work  
**Acceptance:** Can reach Register, Login, or Guest screens

### P1.3 Test Lidyk API
**When:** After auth works  
**What:** Send question, verify response  
**Duration:** 10 minutes  
**Acceptance:** Real response (not fallback) in any language

### P1.4 Full Screenshot Audit
**When:** After all screens work  
**What:** Screenshot each screen in app  
**Duration:** 30 minutes  
**Acceptance:** 10+ screens documented

---

## P2 - MEDIUM (Enhancement)

### P2.1 Test Theme Switching
**When:** After core features work  
**What:** Dark/Light/Auto themes  
**Duration:** 10 minutes

### P2.2 Test All Tabs
**When:** After home screen works  
**What:** Verify each tab loads  
**Duration:** 15 minutes

### P2.3 Test Profile Editing
**When:** After tabs work  
**What:** Edit name, phone, avatar  
**Duration:** 10 minutes

### P2.4 Test Chat UI
**When:** After learning works  
**What:** Verify chat loads (even if no messages)  
**Duration:** 5 minutes

---

## P3 - LOW (Polish)

### P3.1 Performance Testing
**When:** After v10-alpha stable  
**What:** Check memory, battery, latency  

### P3.2 Error Scenario Testing
**When:** After main features work  
**What:** Offline, timeouts, invalid input  

### P3.3 Light Theme Full Audit
**When:** After main features work  
**What:** Verify all screens readable in light mode  

### P3.4 Animation Polish
**When:** Before release  
**What:** Smooth transitions, no jank  

---

## Decision Tree

```
EAS Build Ready?
├─ YES → Download APK
│   ├─ Install → Run Carousel Test Script
│   │   ├─ Carousel works? 
│   │   │   ├─ YES → Test Auth Screen
│   │   │   │   ├─ YES → Test All Features
│   │   │   │   │   └─ v10-alpha READY ✅
│   │   │   │   └─ NO → Debug Auth
│   │   │   └─ NO → Review Logs
│   │   │       ├─ scrollToOffset worked?
│   │   │       │   ├─ YES → Remove scrollToIndex
│   │   │       │   │   └─ Rebuild
│   │   │       │   └─ NO → Try alternative
│   │   │       │       └─ react-native-pager-view
│   └─ Failed?
│       └─ Retry EAS or build locally
└─ NO → Wait more or build locally
```

---

## Estimated Timeline

| Task | Duration | ETA |
|------|----------|-----|
| Build completion | 15 min | ~18:15 |
| Download + install | 5 min | ~18:20 |
| Carousel test | 10 min | ~18:30 |
| Review logs | 5 min | ~18:35 |
| Fix implementation | 20 min | ~18:55 |
| Rebuild | 15 min | ~19:10 |
| Retest carousel | 10 min | ~19:20 |
| Full feature test | 30 min | ~19:50 |
| Documentation | 20 min | ~20:10 |
| **v10-alpha ready** | | **~20:15** |

**Total: ~2.5 hours from now**

---

## Success Metrics for v10-alpha

### MUST HAVE (Blocking)
- [ ] Carousel advances all slides
- [ ] Can reach auth/home screen
- [ ] App doesn't crash
- [ ] No critical errors in logcat

### SHOULD HAVE (Important)
- [ ] Lidyk responds to questions
- [ ] All tabs load
- [ ] Theme switching works
- [ ] Profile loads

### NICE TO HAVE (Polish)
- [ ] Smooth animations
- [ ] All features fully tested
- [ ] Complete documentation

**Release if:** MUST HAVE + at least 3 SHOULD HAVE

---

## Parallel Work Possible

While waiting for carousel fix:
- [ ] Documentation review
- [ ] Prepare test plan for next features
- [ ] Create bug tracking format
- [ ] Plan Phase C work

---

## Known Issues Tracking

### Issue #1: Carousel Navigation
- **Found:** 17:20 UTC
- **Severity:** CRITICAL
- **Status:** 🔄 FIXING
- **Expected Fix:** 18:30-19:20 UTC

### Issue #2: Lidyk Charset (Untested)
- **Found:** Earlier session
- **Severity:** HIGH
- **Status:** 🎯 PENDING TEST
- **Expected Test:** ~19:30 UTC

---

## Go/No-Go Checklist for v10-alpha

Before declaring v10-alpha ready:
- [ ] Carousel works (all 4 slides)
- [ ] Can proceed to auth screen
- [ ] No crashes in logcat
- [ ] At least 5 main screens verified
- [ ] Theme switching works
- [ ] Screenshots documented
- [ ] Tests run without major issues

---

## Contingency Plans

### If Carousel Can't Be Fixed Today
1. Document as known issue
2. Release as v10-beta with warning
3. Tag as "carousel navigation blocked"
4. Continue work on fix in background

### If New Issues Found
1. Categorize severity
2. If critical: fix before release
3. If high: document and release
4. If medium/low: create issue for later

### If Build Takes Too Long
1. Try local gradle build
2. Or use previous APK with debug overlay
3. Or request EAS build priority

---

## Team Communication

**Status Update Template:**
```
Time: HH:MM UTC
Build: [status]
Tests: [pass/fail]
Blockers: [if any]
ETA v10-alpha: [time]
Next Action: [what to do]
```

**When to escalate:**
- Build fails 2x in a row
- Carousel can't be fixed quickly
- New critical issue found
- ETA slips more than 30 min

---

## Notes for v10 Release Plan

Once v10-alpha is stable:
- [ ] Create v10-alpha branch
- [ ] Tag as v10-alpha-001
- [ ] Prepare release notes
- [ ] Plan v10-beta timeline (1 week)
- [ ] Schedule v11 (production hardening)

---

**Current Status:** WAITING FOR APK BUILD  
**Blocker:** Carousel  
**Confidence:** HIGH (can fix once we see logs)  
**v10-alpha ETA:** ~20:15 UTC (2.5 hours from now)  

