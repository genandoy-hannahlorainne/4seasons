# SHDF Option 3 Implementation - Smart Form Merge

## ✅ Phase 1: Backend Implementation (COMPLETED)

### Database Schema

**New Table: `student_shdf_status`**
```sql
- id
- student_id (unique, FK to students)
- school_year_id (FK to school_years)
- basic_completed (boolean)
- basic_completed_at (timestamp)
- comprehensive_completed (boolean)
- comprehensive_completed_at (timestamp)
- comprehensive_deadline (timestamp)
- deadline_notified (boolean)
- timestamps
- unique(student_id, school_year_id)
```

### Models

**StudentSHDFStatus Model**
- `canGenerateQRCode()` - Check if basic info is complete
- `isFullyCompliant()` - Check if both stages are complete
- `isDeadlineApproaching()` - Check if within 2 days of deadline
- `isOverdue()` - Check if deadline has passed

**Student Model Updates**
- Added `shdfStatus()` relationship
- Added `currentShdfStatus()` for current school year

### Services

**SHDFService - New Methods:**
1. `submitBasicInfo(array $validated)` - Stage 1 submission
   - Saves: parent/guardian, emergency contact, height, weight, blood type
   - Creates SHDF status with 7-day deadline
   - Returns: can_generate_qr = true

2. `submitComprehensive(array $validated, $signature)` - Stage 2 submission
   - Requires: basic_completed = true
   - Saves: PhilHealth, immunizations, medical history, family history, consent
   - Updates: comprehensive_completed = true
   - Returns: is_fully_compliant = true

3. `getStatus(int $studentId)` - Get completion status
   - Returns: basic_completed, comprehensive_completed, can_generate_qr, is_fully_compliant, deadline info

4. `upsert()` - Legacy method (combines both stages)

### Controllers

**SHDFController - New Endpoints:**
```php
POST   /api/shdf/basic              - Submit Stage 1 (basic info)
POST   /api/shdf/comprehensive      - Submit Stage 2 (full SHDF)
GET    /api/shdf/{studentId}/status - Get completion status
POST   /api/shdf                    - Legacy full form submission
GET    /api/shdf/{studentId}        - Get SHDF data
GET    /api/shdf/{studentId}/{schoolYearId} - Get by school year
```

### API Flow

#### Stage 1: Basic Info (Quick QR Generation)
```http
POST /api/shdf/basic
{
  "student_id": 1,
  "parent_guardian_name": "Juan Dela Cruz",
  "emergency_contact": "Maria Dela Cruz",
  "emergency_contact_relation": "mother",
  "emergency_contact_phone": "09171234567",
  "height_cm": 165,
  "weight_kg": 55,
  "blood_type": "O+"
}

Response:
{
  "success": true,
  "message": "Basic information saved successfully. You can now generate your QR code.",
  "can_generate_qr": true,
  "comprehensive_deadline": "2026-03-31T10:30:00Z"
}
```

#### Stage 2: Comprehensive (Full Compliance)
```http
POST /api/shdf/comprehensive
{
  "student_id": 1,
  "immunizations": {...},
  "philhealth": {...},
  "medical_history": {...},
  "family_history": {...},
  "parental_consent": {...},
  "signature": <file>
}

Response:
{
  "success": true,
  "message": "SHDF form completed successfully. You are now fully compliant.",
  "is_fully_compliant": true
}
```

#### Check Status
```http
GET /api/shdf/1/status

Response:
{
  "basic_completed": true,
  "comprehensive_completed": false,
  "can_generate_qr": true,
  "is_fully_compliant": false,
  "comprehensive_deadline": "2026-03-31T10:30:00Z",
  "is_overdue": false,
  "is_deadline_approaching": true
}
```

---

## 🔄 Phase 2: Frontend Implementation (NEXT)

### Component Structure

```
frontend/src/app/features/shdf/
├── shdf-form/
│   ├── shdf-form.component.ts          (Main form - updated)
│   ├── shdf-form.component.html        (Template - updated)
│   └── shdf-form.component.scss
├── shdf-basic/
│   ├── shdf-basic.component.ts         (NEW - Stage 1)
│   ├── shdf-basic.component.html
│   └── shdf-basic.component.scss
├── shdf-comprehensive/
│   ├── shdf-comprehensive.component.ts (NEW - Stage 2)
│   ├── shdf-comprehensive.component.html
│   └── shdf-comprehensive.component.scss
├── shdf-status/
│   ├── shdf-status.component.ts        (NEW - Status widget)
│   ├── shdf-status.component.html
│   └── shdf-status.component.scss
└── shdf.service.ts                     (Updated)
```

### Service Updates

```typescript
// shdf.service.ts
export class SHDFService {
  // NEW
  submitBasic(data: SHDFBasicData): Observable<SHDFBasicResponse>
  submitComprehensive(data: FormData): Observable<SHDFComprehensiveResponse>
  getStatus(studentId: number): Observable<SHDFStatus>
  
  // EXISTING
  getShdf(studentId: number): Observable<SHDFRecord>
  submitShdf(payload: FormData): Observable<SHDFRecord>
}
```

### Routing Updates

```typescript
// shdf.routes.ts
export const SHDF_ROUTES: Routes = [
  {
    path: ':studentId',
    children: [
      { path: '', redirectTo: 'status', pathMatch: 'full' },
      { path: 'status', component: SHDFStatusComponent },
      { path: 'basic', component: SHDFBasicComponent },
      { path: 'comprehensive', component: SHDFComprehensiveComponent },
      { path: 'full', component: SHDFFormComponent }, // Legacy
    ]
  },
];
```

### User Flow

```
┌─────────────────────────────────────┐
│  Student Dashboard                  │
│  ⚠️ Complete your SHDF              │
│  [Start SHDF Form]                  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  SHDF Status Page                   │
│  ○ Basic Info (Required for QR)     │
│  ○ Comprehensive Info               │
│  [Start Basic Form]                 │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  SHDF Basic Form (Stage 1)          │
│  ✓ Student Info (pre-filled)        │
│  ✓ Parent/Guardian                  │
│  ✓ Emergency Contact                │
│  ✓ Height, Weight, Blood Type       │
│  [Save & Generate QR]               │
│  [Complete Full Form Now]           │
└─────────────────────────────────────┘
         ↓ (Save & Generate QR)
┌─────────────────────────────────────┐
│  ✅ QR Code Generated!              │
│  Your QR code is ready to use.      │
│                                     │
│  ⚠️ Complete full SHDF by:          │
│  March 31, 2026 (7 days left)       │
│                                     │
│  [Complete Now] [Remind Me Later]   │
└─────────────────────────────────────┘
         ↓ (Complete Now)
┌─────────────────────────────────────┐
│  SHDF Comprehensive Form (Stage 2)  │
│  ✓ PhilHealth Information           │
│  ✓ Immunization Records (9)         │
│  ✓ Medical History                  │
│  ✓ Family History                   │
│  ✓ Parental Consent & Signature     │
│  [Submit Complete Form]             │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  ✅ Fully Compliant!                │
│  Your SHDF is complete.             │
│  [View My SHDF] [Back to Dashboard] │
└─────────────────────────────────────┘
```

---

## 📊 Dashboard Integration

### Student Dashboard Updates

**Status Widget:**
```html
<div class="shdf-status-widget" *ngIf="shdfStatus">
  <!-- Basic Info Status -->
  <div class="status-item" [class.completed]="shdfStatus.basic_completed">
    <span class="icon">{{ shdfStatus.basic_completed ? '✅' : '○' }}</span>
    <span class="label">Basic Info</span>
    <span class="badge" *ngIf="!shdfStatus.basic_completed">Required for QR</span>
  </div>
  
  <!-- Comprehensive Status -->
  <div class="status-item" [class.completed]="shdfStatus.comprehensive_completed">
    <span class="icon">{{ shdfStatus.comprehensive_completed ? '✅' : '○' }}</span>
    <span class="label">Full SHDF</span>
    <span class="badge warning" *ngIf="shdfStatus.is_deadline_approaching">
      Due in {{ daysLeft }} days
    </span>
    <span class="badge danger" *ngIf="shdfStatus.is_overdue">Overdue</span>
  </div>
  
  <!-- Action Button -->
  <button *ngIf="!shdfStatus.basic_completed" (click)="startBasicForm()">
    Start SHDF Form
  </button>
  <button *ngIf="shdfStatus.basic_completed && !shdfStatus.comprehensive_completed" 
          (click)="completeComprehensive()">
    Complete Full Form
  </button>
  <button *ngIf="shdfStatus.is_fully_compliant" (click)="viewShdf()">
    View My SHDF
  </button>
</div>
```

---

## 🔄 Migration Strategy

### Step 1: Migrate Existing Data
```sql
-- Migrate students who have completed Personal Medical Info
INSERT INTO student_shdf_status (student_id, school_year_id, basic_completed, basic_completed_at)
SELECT 
  s.student_id,
  sy.id as school_year_id,
  TRUE as basic_completed,
  NOW() as basic_completed_at
FROM students s
CROSS JOIN school_years sy
WHERE sy.is_current = TRUE
  AND s.emergency_contact IS NOT NULL
  AND s.emergency_contact_phone IS NOT NULL
ON DUPLICATE KEY UPDATE basic_completed = TRUE;
```

### Step 2: Notify Students
- Send email/notification to students with basic_completed = true
- Remind them to complete comprehensive form within 7 days

### Step 3: Gradual Rollout
1. Week 1: Backend deployment + migration
2. Week 2: Frontend deployment (both forms available)
3. Week 3: Monitor completion rates
4. Week 4: Deprecate old Personal Medical Info form

---

## 📝 Testing Checklist

### Backend Tests
- [ ] Basic info submission creates status record
- [ ] Basic info enables QR code generation
- [ ] Comprehensive submission requires basic completion
- [ ] Comprehensive submission marks fully compliant
- [ ] Status endpoint returns correct data
- [ ] Deadline calculation is correct (7 days)
- [ ] Overdue detection works
- [ ] Deadline approaching detection works

### Frontend Tests
- [ ] Basic form displays correctly
- [ ] Basic form submits successfully
- [ ] QR code generation enabled after basic submission
- [ ] Comprehensive form requires basic completion
- [ ] Comprehensive form displays correctly
- [ ] Comprehensive form submits successfully
- [ ] Status widget displays correctly
- [ ] Deadline warnings show appropriately
- [ ] Navigation between stages works

### Integration Tests
- [ ] Complete flow: basic → QR → comprehensive
- [ ] Status updates in real-time
- [ ] Dashboard reflects completion status
- [ ] Notifications sent at appropriate times

---

## 🚀 Deployment Steps

1. **Database Migration**
   ```bash
   docker-compose exec backend php artisan migrate
   ```

2. **Data Migration**
   ```bash
   docker-compose exec backend php artisan db:seed --class=SHDFStatusSeeder
   ```

3. **Frontend Build**
   ```bash
   docker-compose restart frontend
   ```

4. **Verify Routes**
   ```bash
   docker-compose exec backend php artisan route:list | grep shdf
   ```

5. **Test Endpoints**
   ```bash
   # Test status endpoint
   curl http://localhost:8082/api/shdf/1/status
   
   # Test basic submission
   curl -X POST http://localhost:8082/api/shdf/basic \
     -H "Authorization: Bearer TOKEN" \
     -d '{"student_id":1,...}'
   ```

---

## 📈 Success Metrics

- **QR Code Generation Time**: < 5 minutes (vs 20+ minutes for full form)
- **Basic Completion Rate**: Target 95% within first week
- **Comprehensive Completion Rate**: Target 80% within deadline
- **User Satisfaction**: Reduced form abandonment rate

---

## 🎯 Next Steps

1. ✅ Backend implementation (DONE)
2. ⏳ Frontend components (IN PROGRESS)
3. ⏳ Dashboard integration
4. ⏳ Notification system
5. ⏳ Testing
6. ⏳ Deployment

---

**Status**: Phase 1 (Backend) Complete ✅
**Next**: Implement Frontend Components
