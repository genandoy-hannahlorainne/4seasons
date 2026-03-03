# Student Badge & Streak Feature Documentation

## Project Context
This document defines the Badge + Streak feature aligned with the **current 4Seasons codebase** (student dashboard, student profile, personal medical info, medical history, allergies, QR readiness).

The feature is designed to avoid rewarding unhealthy behavior (e.g., skipping clinic care) and instead reward:
- profile/medical completeness,
- timely updates,
- responsible engagement.

---

## 1) Feature Goal
Create a motivational badge system for students with:
1. **Streak milestones** (3, 7, 30, 90, 365)
2. **Badge unlock events** tied to real actions already available in the app
3. **AI-generated badge paragraph** for personalized recognition text

---

## 2) Scope Aligned to Existing Student Capabilities
Based on current frontend/backend flows, student can already:
- View dashboard and medical records
- Update personal contact info
- Update physical info (height/weight/blood type)
- Update allergies
- Update medical history
- View/download QR readiness when form is complete

Therefore, streaks and badges should rely on these actions, not on arbitrary daily login.

---

## 3) Badge Model (Recommended)

### A. Completion Badges (one-time)
- **Profile Complete**: personal/contact info complete
- **Physical Info Complete**: height + weight + blood type set
- **Medical History Complete**: required history fields saved
- **Allergy Record Complete**: at least one allergy OR explicitly no known allergies
- **QR Ready Badge**: all required forms complete + QR shown/downloaded

### B. Maintenance Streak Badges
> Streak counts only on **school days** (weekends excluded).

- **3-Day Stability**
- **7-Day Stability**
- **30-Day Stability**
- **90-Day Stability**
- **365-Day Stability**

#### Streak Day Validity (per school day)
A day is counted if:
- student has no critical concern flag, and
- required medical profile remains complete, and
- no unresolved high-priority clinic advisory.

> Optional: If student had a routine clinic visit but complied with follow-up, mark day as valid (not penalized).

### C. Comeback / Resilience Badges
- **Back on Track (7)**: after streak break, reaches 7 again
- **Resilient (30)**: rebuilds to 30 after any break

---

## 4) Important Safety Rule
Do **not** design as "No clinic visit = reward" only.

Use this framing instead:
- **Wellness Stability Badge** = stable status + complete records + no unresolved concerns.

This prevents students from avoiding proper clinic care just to keep streaks.

---

## 5) Streak Logic Specification

### Time Logic
- Use school timezone (Asia/Manila)
- Evaluate by date (`YYYY-MM-DD`)
- Exclude Saturday/Sunday by default
- Future extension: use school calendar table for holidays/suspensions

### Break Conditions
Streak breaks when:
- required profile completeness becomes invalid, OR
- student has unresolved high-priority alert beyond grace window

### Grace Options (optional)
- 1 grace day every 30 valid school days
- no grace for emergency unresolved status

---

## 6) Data Design (Suggested)

### `student_badges`
- `id`
- `student_id`
- `badge_key`
- `badge_name`
- `tier` (bronze/silver/gold/platinum)
- `awarded_at`
- `source_snapshot_json`
- `ai_generated_text`
- `is_featured`

### `student_streaks`
- `id`
- `student_id`
- `current_streak`
- `longest_streak`
- `last_counted_date`
- `streak_status` (active/broken/paused)
- `break_reason`
- `updated_at`

### `badge_events` (audit trail)
- `id`
- `student_id`
- `event_type` (profile_update, physical_update, history_update, allergy_update, streak_increment, badge_awarded)
- `event_date`
- `payload_json`
- `created_at`

---

## 7) Trigger Points in Current Flow

Badge/Streak evaluation should be triggered after successful:
- personal info save
- physical info save
- allergies save
- medical history save
- daily status scheduler (for school-day streak update)

Current candidate screens/services in existing system:
- Student Profile / Personal Info saves
- Student Medical Data update endpoint
- Dashboard refresh for showing active badges/streak status

---

## 8) AI Paragraph Generation

### Purpose
Generate motivational paragraph after badge unlock.

### Input Context
- student first name
- badge name
- milestone value (3/7/30/90/365 etc.)
- short summary of qualifying actions

### Output Rules
- 40–80 words
- supportive, school-appropriate tone
- no diagnosis, no medical claims
- no shaming language

### Fallback
If AI fails/timeouts:
- use template text from local badge copy table

---

## 9) API Suggestions

### Student Endpoints
- `GET /student/badges`
- `GET /student/streak-status`

### System Endpoints
- `POST /student/badges/evaluate` (internal call after updates)
- `POST /student/streaks/daily-rollup` (cron/scheduler)

### Admin/Staff Visibility (optional)
- `GET /admin/badges/summary`
- `GET /adviser/class-badges`

---

## 10) UI/UX Placement

### Student Dashboard
- card: current streak + next milestone
- recent unlocked badges carousel
- AI badge narrative panel

### Student Profile / Medical Records
- badge history tab
- completion progress bar (required profile fields)

### Notifications
- badge unlock toast
- milestone modal (optional for high badges: 90/365)

---

## 11) Acceptance Criteria (MVP)

1. Student who completes required profile gets completion badges automatically.
2. System updates streak only on school days.
3. 3/7/30/90/365 milestone badges unlock correctly.
4. Badge unlock generates AI text or fallback template.
5. Badge history is persisted and visible in student dashboard.
6. Streak does not reward clinic avoidance behavior.

---

## 12) Rollout Plan

### Phase 1 (MVP)
- completion badges
- 3/7/30 streak
- basic AI paragraph + fallback template

### Phase 2
- 90/365 streak
- resilience badges
- adviser/admin visibility

### Phase 3
- school holiday calendar integration
- richer AI narratives (localized tone)
- badge analytics and engagement insights

---

## 13) Suggested Badge Keys
- `profile_complete`
- `physical_complete`
- `history_complete`
- `allergy_complete`
- `qr_ready`
- `streak_3`
- `streak_7`
- `streak_30`
- `streak_90`
- `streak_365`
- `comeback_7`
- `resilient_30`

---

## 14) Notes for Team Alignment
- Keep badge criteria deterministic and auditable.
- Ensure all badge grants are server-side validated.
- Avoid any game mechanic that discourages students from seeking care.
- Treat AI text as optional enhancement, not core business logic.

---

Prepared for: 4Seasons Student Badge Feature
Date: 2026-03-03
