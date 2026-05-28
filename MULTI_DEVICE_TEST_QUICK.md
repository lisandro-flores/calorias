# Quick Multi-Device Sync Test Guide

## 5-Minute Quick Test (Scenario 2: Conflicting Edits)

### Prerequisites
- Backend running: `cd backend && npm run start:dev`
- Frontend running: `npm start`
- MongoDB connected
- Two empty browser windows ready

---

## Test Execution

### Phase 1: Device A - Create Base Entry (1 min)

**Window 1 - Device A**:
1. Open `http://localhost:4200`
2. Log in with test credentials
3. Wait for "Cargando desde la nube..." to finish (5s timeout, then shows local or cloud data)
4. Verify SyncIndicator shows cloud icon ✓
5. **Add Meal**:
   - Click "Agregar Comida" 
   - Select "Desayuno"
   - Add food: "Huevos" 300 kcal
   - Tap "Guardar"
6. Wait 5s for green "Sincronizado" badge
7. **Verify**: Outbox panel (bottom right) shows 0 pending ✓

---

### Phase 2: Device B - Pull Same Entry, Simulate Offline (1.5 min)

**Window 2 - Device B**:
1. Open `http://localhost:4200` (NEW SESSION)
2. Log in with SAME test credentials
3. Wait for hydration (pull from cloud)
4. **Verify**: Dashboard shows "Desayuno: 300 kcal" from Device A ✓
5. **Go Offline**:
   - DevTools → Network → Throttling dropdown → "Offline"
   - **Verify**: Offline indicator appears (red icon)
6. **Add Different Meal**:
   - Click "Agregar Comida"
   - Select "Almuerzo"
   - Add food: "Pollo" 650 kcal
   - Tap "Guardar"
7. **Verify**: OutboxPanel shows "1 pending" ✓
8. **Check Outbox Detail**:
   - Click OutboxPanel item
   - Should show `expectedVersion: 1` (pulled version from Device A)

---

### Phase 3: Sync & Merge (1.5 min)

**Window 2 - Device B**:
9. **Go Online**:
   - DevTools → Network → Throttling → "No throttling"
   - **Verify**: Sync starts automatically (watch POST request in Network tab)
10. **Verify Merge Success**:
    - OutboxPanel clears (0 pending)
    - "Almuerzo: 650 kcal" still visible
    - SyncIndicator green ✓

**Window 1 - Device A**:
11. **Wait 20s** for auto-refresh (or click refresh icon)
12. Wait for "Cargando..." overlay
13. **Verify Merge Result**:
    - Both "Desayuno: 300" AND "Almuerzo: 650" visible
    - Total: 950 kcal
    - No duplicates ✓
    - dataSource shows "cloud" ✓

---

## Server-Side Verification (1 min)

**Terminal**:
```bash
mongo
use calorias
db.entries.findOne({ user: "test@example.com" })
```

**Expected Output**:
```json
{
  "_id": ObjectId(...),
  "date": ISODate("2026-05-28T00:00:00.000Z"),
  "user": "test@example.com",
  "version": 2,
  "meals": [
    {
      "name": "Desayuno",
      "foods": [{ "name": "Huevos", "calories": 300, ... }]
    },
    {
      "name": "Almuerzo", 
      "foods": [{ "name": "Pollo", "calories": 650, ... }]
    }
  ],
  "waterGlasses": 0
}
```

---

## PASS / FAIL Criteria

| Criterion | Status |
|-----------|--------|
| Device B offline sync didn't lose data | ✅ / ❌ |
| Server merged both meals (v1→v2) | ✅ / ❌ |
| Device A pulled merged data within 20s | ✅ / ❌ |
| No duplicate meals created | ✅ / ❌ |
| Outbox deduplication worked | ✅ / ❌ |
| Both devices show identical state | ✅ / ❌ |

---

## If Test Fails

### Device B Won't Sync After Going Online
- Check backend logs: `npm run start:dev` terminal for errors
- Check Network tab: Is POST `/entries/sync` completing?
- Verify version field in Mongo (might be missing)

### Device A Doesn't Show Merged Data
- Wait longer (up to 30s, could be slow DB)
- Click refresh button manually in Device A
- Check browser console for errors

### Data Duplicated
- Verify `mergeMeals()` logic in backend
- Check OutboxService dedupeKey is working
- Verify `food.id` fields are unique

### Outbox Won't Clear
- Check browser network is actually online
- Reload page to reset OutboxService state
- Check backend `/entries/sync` response has `success: true`

---

## Quick Reset Between Tests

**Browser Console (both windows)**:
```javascript
localStorage.clear()
location.reload()
```

**Database Reset**:
```bash
mongo
use calorias
db.entries.deleteMany({})
```

---

## Optional: Deduplication Test (Fase 4)

**Window 1 only**:
1. Log in, get to dashboard
2. DevTools Network → Slow 3G throttle
3. Rapidly click "Agregar Comida" 3 times in 2 seconds:
   - Add 100 kcal snack
   - Edit to 150 kcal
   - Add another 200 kcal snack
4. **Watch OutboxPanel**: Should show "1 pending" (not 3) ✓
5. **Watch Network tab**: Should see only 1 POST `/entries/sync` request ✓

---

## Next: Automated Testing

Once manual tests pass, run E2E tests:
```bash
npx playwright test e2e/tests/multi-device.spec.ts
```

