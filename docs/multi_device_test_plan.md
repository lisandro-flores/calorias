# Multi-Device Synchronization Test Plan

## Overview

This document outlines comprehensive testing scenarios to verify cloud-first data synchronization works correctly across multiple devices, preventing data loss and ensuring consistent state.

---

## Setup Prerequisites

### Local Development Environment

1. **Backend**: NestJS running on `http://localhost:3000`
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Frontend**: Angular dev server on `http://localhost:4200`
   ```bash
   npm start
   ```

3. **MongoDB**: Running locally or on Atlas
   - Verify connection in `backend/.env`

4. **Multiple Browser Windows**: 
   - Chrome/Firefox window #1 (Device A simulation)
   - Chrome/Firefox window #2 (Device B simulation)
   - Optional: Incognito windows to simulate different users

---

## Test Scenarios

### Scenario 1: Single Device - Offline Sync

**Goal**: Verify pending entries sync when device goes online.

**Steps**:
1. Open `http://localhost:4200` in Device A (Window #1)
2. Log in with test user (e.g., `test@example.com`)
3. Wait 5s for cloud hydration to complete
4. Open Browser DevTools → Network tab → Throttle to "Offline"
5. Add meal: "Desayuno" with 500 kcal
6. Verify SyncIndicator shows "1 pending"
7. Verify OutboxPanel shows the pending entry
8. Turn network back online (throttle to "No throttling")
9. Wait 20s for automatic retry
10. **Expected**: Sync completes, OutboxPanel clears, meal persists

**Verification**:
```bash
# In backend terminal, check Mongo
db.entries.findOne({ user: "test@example.com", date: ISODate("2026-05-28") })
# Should show version: 1, meals array with Desayuno entry
```

---

### Scenario 2: Two Devices - Conflicting Edits

**Goal**: Verify version-based merge when both devices edit the same day's entry simultaneously.

**Setup**: 
- Device A already has 1 meal entry synced (version: 1)
- Device B is pulling fresh data but will edit while offline

**Steps**:

#### Phase 2a: Initialize Device A with Entry
1. Device A logs in, adds "Desayuno" (500 kcal)
2. Verify sync completes (dataSource = 'cloud', version: 1)
3. Verify in Mongo: entry has version: 1

#### Phase 2b: Device B Pulls Same Entry (Offline Edit)
4. Device B logs in, hydrates successfully (version: 1 pulled)
5. Throttle Device B network to Offline
6. Device B adds "Almuerzo" (800 kcal) to same day
7. Verify SyncIndicator shows "1 pending" on B
8. Verify OutboxPanel shows expectedVersion: 1

#### Phase 2c: Trigger Sync on Both
9. Device B goes Online
10. **Expected**: Device B syncs with expectedVersion: 1, server merges (version: 2)
11. Wait 20s for Device A's automatic refresh
12. **Expected**: Device A pulls fresh data and shows both Desayuno + Almuerzo

**Verification - Server State**:
```bash
db.entries.findOne({ user: "test@example.com", date: ISODate("2026-05-28") })
# Should show:
#   version: 2
#   meals: [ 
#     { name: "Desayuno", foods: [...] },
#     { name: "Almuerzo", foods: [...] }
#   ]
```

**Verification - Client State**:
- Device A: Dashboard shows both meals + total 1300 kcal
- Device B: Dashboard shows both meals + total 1300 kcal
- No meal duplicates or data loss

---

### Scenario 3: Rapid Edits - Deduplication (Fase 4)

**Goal**: Verify multiple rapid edits on same day deduplicate in outbox (one request, not N).

**Steps**:
1. Device A logs in, gets entry (version: 1)
2. Throttle Device A to network throttle (slow 3G) to see effects
3. Rapidly edit the same day 5x within 2 seconds:
   - Edit 1: Add 100 kcal snack
   - Edit 2: Remove snack, add same snack (correction)
   - Edit 3: Change portion (200 kcal)
   - Edit 4: Add second snack (100 kcal)
   - Edit 5: Final adjustment (220 kcal total)

**Expected Behavior**:
- SyncIndicator counts as "1 pending" (not 5)
- OutboxPanel shows 1 item (not 5)
- Only 1 POST request to `/entries/sync` (deduplication worked)
- Server receives latest payload with all adjustments merged

**Verification**:
```bash
# In browser DevTools → Network tab
# Filter for POST /entries/sync
# Should see exactly 1 request (not 5)
# Payload shows final state: all edits combined
```

---

### Scenario 4: Multi-Device Pull After Merge (Fase 5)

**Goal**: Verify automatic data pull after sync pushes merged data to both devices.

**Steps**:
1. Device A: Add "Desayuno" entry (version: 1)
2. Device B: Pull same entry, go offline
3. Device B: Add "Almuerzo" (outbox pending)
4. Device B: Go online, sync completes (server merges, version: 2)
5. **Expected**: Device B automatically pulls fresh data showing version: 2

#### Verify Re-fetch Trigger (Fase 5):
6. Check Device B console logs for: `"Entry sync completed, pulling fresh data from server..."`
7. Verify Device B's dataSource remains 'cloud'
8. Verify Device B displays both meals

---

### Scenario 5: Three Devices - Chain Conflict Resolution

**Goal**: Stress test versioning with 3+ devices creating parallel entries.

**Setup**:
- Device A, B, C all logged in, pull fresh entry (version: 1)
- Each device goes offline

**Steps**:
1. Device A (offline): Adds "Desayuno" (500 kcal), outbox shows v1
2. Device B (offline): Adds "Almuerzo" (800 kcal), outbox shows v1  
3. Device C (offline): Adds "Cena" (600 kcal), outbox shows v1
4. Device A goes Online → Syncs first, server merges to v2
5. Device B goes Online → Syncs, server merges v2 → v3
6. Device C goes Online → Syncs, server merges v3 → v4
7. All devices should pull fresh data showing all 3 meals at version 4

**Verification**:
```bash
db.entries.findOne({ user: "test@example.com" })
# Should show version: 4
# Meals array contains: Desayuno, Almuerzo, Cena (no duplicates)
```

---

### Scenario 6: Timeout Fallback (Fase 1)

**Goal**: Verify graceful fallback to local data after 5s cloud timeout.

**Steps**:
1. Disconnect MongoDB (or stop backend server)
2. Open new Device C session
3. Log in attempt
4. Watch Dashboard:
   - **0-1s**: Skeleton UI + "Cargando desde la nube..."
   - **5s**: Yellow warning banner appears: "Mostrando datos locales — sin conexión"
   - **5s+**: Local data loads (if available)
5. Reconnect MongoDB/backend
6. Wait 20s auto-refresh or manually refresh
7. **Expected**: Cloud hydration completes, banner disappears, stays in "cloud" mode

---

### Scenario 7: Profile Sync (Multi-field Update)

**Goal**: Verify non-entry sync works (e.g., profile changes).

**Steps**:
1. Device A: Log in, go to Profile
2. Change "Current Weight" from 80kg → 78kg
3. Verify OutboxPanel shows "profile-sync" pending
4. Wait for sync to complete
5. Device B: Log in separately, go to Profile
6. **Expected**: Device B's profile also shows 78kg (pulled from server)

---

## Automated Test Script (Optional)

Create a Playwright test to run multi-device scenarios:

```bash
# frontend e2e tests
npm run test:e2e

# Create scenario in e2e/tests/multi-device.spec.ts
```

Example test structure:
```typescript
// e2e/tests/multi-device.spec.ts
import { test, expect, Browser, BrowserContext } from '@playwright/test';

test('scenario-2-conflicting-edits', async ({ browser }) => {
  // Create two contexts (simulating two devices)
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  
  // Step 1: Both login
  await pageA.goto('http://localhost:4200/login');
  // ... login flow ...
  
  // Step 2: Device A adds meal
  await pageA.click('button:has-text("Add Meal")');
  // ... add meal ...
  
  // Step 3: Device B goes offline
  await contextB.setOfflineMode(true);
  
  // Step 4: Device B adds conflicting meal
  // ... add meal ...
  
  // Step 5: Device B goes online, sync triggers
  await contextB.setOfflineMode(false);
  
  // Wait for merge + pull
  await pageB.waitForFunction(() => {
    // Check if both meals visible
    return document.querySelectorAll('[data-meal]').length === 2;
  }, 20_000);
  
  expect(true).toBe(true); // Replace with actual assertions
});
```

---

## Manual Testing Checklist

- [ ] **Scenario 1**: Single device offline sync
- [ ] **Scenario 2**: Dual device conflict merge
- [ ] **Scenario 3**: Rapid edit deduplication
- [ ] **Scenario 4**: Multi-device pull after merge
- [ ] **Scenario 5**: Three-device chain resolution
- [ ] **Scenario 6**: Timeout fallback to local
- [ ] **Scenario 7**: Profile multi-field sync

---

## Debugging Tips

### Check Outbox State
```javascript
// Browser console
JSON.parse(localStorage.getItem('outbox_v1'))
```

### Monitor Sync Activity
```javascript
// In browser console, monitor NutritionStateService
window.state = /* reference to service */
window.state.syncStatus()
window.state.dataReady()
window.state.currentEntryVersion()
```

### Server-Side Logging
```bash
# Backend logs show merge operations
[Merge] Conflict for test@example.com on 2026-05-28: client v1, server v2
```

### Reset Test Data
```bash
# Quick reset for testing
mongo
use calorias
db.entries.deleteMany({ user: "test@example.com" })
db.users.deleteOne({ email: "test@example.com" })
```

---

## Success Criteria

✅ **All scenarios pass** if:
1. No data loss occurs (meals/water/profile preserved)
2. No duplicate entries are created
3. Version tracking increases correctly (1→2→3...)
4. All devices converge to identical state
5. Outbox deduplicates within 2s window
6. Re-fetch post-push completes within 1s
7. Timeout fallback works gracefully

---

## Known Limitations

- **Time sync**: Ensure all devices have synchronized system clocks
- **Network conditions**: Throttling works best on Chrome; use Network tab
- **MongoDB Atlas**: If testing against cloud DB, latency will be higher (expect 500ms+ for sync)
- **Session timeout**: User sessions expire after 1 hour; re-login if needed

