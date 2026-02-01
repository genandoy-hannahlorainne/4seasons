# User Scenarios: Emergency/Routine Workflow System

## 👨‍⚕️ **SCENARIO 1: CLINIC STAFF - Emergency Case**

### **User**: Nurse Maria Santos
### **Situation**: Student with severe allergic reaction

**Step-by-Step Process:**

1. **Login & Access**
   - Maria logs into the system as "Clinic Staff"
   - Navigates to "New Medical Visit" form

2. **Student Identification**
   - Student John Cruz (Grade 10-A) arrives with difficulty breathing
   - Maria scans John's QR code from his ID
   - System immediately displays: "⚠️ ALLERGIES: Peanuts (Severe), Shellfish (Moderate)"

3. **Visit Documentation**
   - **Date/Time**: Auto-filled (2026-01-15 10:30 AM)
   - **Visit Type**: Selects "Emergency" (only 2 options available)
   - **Vitals**: Temperature 37.2°C, BP 140/90, Pulse 110 bpm
   - **Chief Complaint**: "Severe allergic reaction - difficulty breathing, facial swelling"
   - **Diagnosis**: Selects "Allergy"
   - **Status**: "Referred to Hospital"

4. **System Response (Automatic)**
   - ✅ Visit flagged as "Emergency"
   - ✅ All admins receive urgent notifications
   - ✅ Emergency emails sent to admin@fourseasons.edu.ph
   - ✅ Parent SMS automatically enabled
   - ✅ Red alert appears on admin dashboard

5. **Final Actions**
   - Maria checks "Notify Parent" (already auto-enabled for emergency)
   - Submits form
   - System confirms: "Emergency visit saved. Admin and parents notified."

**What Maria Sees:**
- Simple 2-option dropdown (Routine/Emergency)
- Automatic parent notification for emergency
- Clear confirmation of notifications sent
- Student allergy warnings prominently displayed

---

## 👨‍💼 **SCENARIO 2: ADMIN - Emergency Response**

### **User**: Principal Dr. Roberto Dela Cruz
### **Situation**: Receiving emergency notification

**Step-by-Step Process:**

1. **Notification Receipt**
   - Dr. Dela Cruz is in his office when his dashboard shows:
   - 🚨 **RED BANNER**: "1 Emergency Alert"
   - **Message**: "EMERGENCY ALERT: Student John Cruz (2024-001234) from Grade 10-A has been flagged for emergency medical attention. Complaint: Severe allergic reaction - difficulty breathing, facial swelling"

2. **Email Notification**
   - Receives email: "🚨 EMERGENCY ALERT - Medical Attention Required"
   - **Subject**: Professional HTML email with student details
   - **Content**: Complete emergency information with timestamp

3. **Dashboard Review**
   - Clicks "View" on emergency notification
   - Sees detailed popup:
     ```
     Emergency Details:
     Student: John Cruz
     Student Number: 2024-001234
     Grade & Section: 10-A
     Complaint: Severe allergic reaction - difficulty breathing, facial swelling
     Visit Status: Referred to Hospital
     Time: 2 minutes ago
     Staff: Nurse Maria Santos
     Position: Clinic Staff
     ```

4. **Immediate Actions**
   - Calls clinic to check on student status
   - Contacts parents directly if needed
   - Coordinates with hospital if referral required
   - Marks notification as read after handling

5. **Follow-up**
   - Monitors for additional emergency notifications
   - Reviews incident for policy improvements
   - Ensures proper documentation for insurance/legal

**What Dr. Dela Cruz Experiences:**
- Immediate visual alert (red banner with animation)
- Professional email notification
- Complete student information at a glance
- Easy notification management
- Clear escalation path

---

## 👩‍🏫 **SCENARIO 3: ADVISER - Routine Notification**

### **User**: Teacher Ms. Ana Reyes (Grade 7-B Adviser)
### **Situation**: Student routine clinic visit

**Step-by-Step Process:**

1. **Student Visit**
   - Her student, Sarah Mendoza (Grade 7-B), visits clinic for headache
   - Clinic staff selects "Routine" visit type
   - System identifies Ms. Reyes as Sarah's adviser

2. **Notification Receipt**
   - Ms. Reyes sees notification badge on her dashboard
   - **System Notification**: "Student Sarah Mendoza (2026-007890) visited the clinic for routine care. Complaint: Headache"
   - **Email Notification**: Professional email with visit details

3. **Dashboard Review**
   - Opens notifications panel
   - Sees new notification from "Clinic System"
   - **Details**:
     ```
     Routine Visit Notification
     Student: Sarah Mendoza (2026-007890)
     Reason: Headache
     Time: 1:45 PM
     Status: Completed
     Attended by: Clinic Staff
     ```

4. **Follow-up Actions**
   - Checks on Sarah when she returns to class
   - Notes if student seems better or needs additional attention
   - May contact parents if concerned about recurring headaches
   - Marks notification as read

5. **Class Management**
   - Updates her mental notes about student health patterns
   - Considers if classroom environment factors (lighting, stress) contribute
   - Plans to monitor student's academic performance

**What Ms. Reyes Experiences:**
- Non-urgent notification (normal priority)
- Informational email for her records
- Easy access to student visit details
- Ability to follow up appropriately
- Integration with existing notification system

---

## 👨‍🎓 **SCENARIO 4: STUDENT - Medical Visit Experience**

### **User**: Student Mark Gonzales (Grade 11-STEM)
### **Situation**: Feeling unwell during class

**Step-by-Step Process:**

1. **Initial Request**
   - Mark feels dizzy and nauseous during Chemistry class
   - Asks teacher for clinic pass
   - Goes to school clinic

2. **Clinic Arrival**
   - Presents student ID to clinic staff
   - Staff scans QR code - system shows his profile
   - **Displayed Info**: Mark Gonzales, 2025-011567, Grade 11-STEM
   - **Medical History**: No known allergies, previous visits for minor injuries

3. **Medical Assessment**
   - Clinic staff takes vitals: Temperature 37.8°C, normal BP and pulse
   - Mark describes symptoms: "Dizzy, nauseous, didn't eat breakfast"
   - Staff determines this is routine (not emergency)

4. **Treatment & Documentation**
   - Given water and crackers
   - Rests for 30 minutes
   - Staff documents as "Routine" visit
   - **Diagnosis**: "Dehydration/Low blood sugar"
   - **Status**: "Completed"

5. **System Processing**
   - Visit recorded in Mark's digital medical record
   - His adviser (Mr. Santos) receives routine notification
   - Parents NOT notified (routine visit, checkbox unchecked)
   - Mark can view this visit in his medical history

6. **Return to Class**
   - Feeling better, returns to class with clinic slip
   - Adviser Mr. Santos checks on him (received notification)
   - Mark continues normal school day

**What Mark Experiences:**
- Quick identification via QR code
- Professional medical care
- Privacy maintained (parents not auto-notified for routine)
- Digital record keeping for future reference
- Seamless return to academic activities

---

## 👩‍💼 **SCENARIO 5: PARENT - Emergency Notification**

### **User**: Mrs. Elena Cruz (Parent of John Cruz)
### **Situation**: Receiving emergency notification about child

**Step-by-Step Process:**

1. **SMS Notification Receipt**
   - Receives SMS at 10:35 AM (5 minutes after incident):
   - **Message**: "🚨 URGENT: Your child John Cruz visited the school clinic today. Reason: Severe allergic reaction - difficulty breathing, facial swelling. Please contact the clinic immediately for more details. Four Seasons School Clinic: (02) 8123-4567"

2. **Email Notification**
   - Receives professional HTML email:
   - **Subject**: "🚨 URGENT: Your child visited the school clinic"
   - **Content**: Detailed information with clinic contact details
   - **Emphasis**: Emergency nature clearly communicated

3. **Immediate Response**
   - Calls school clinic immediately: (02) 8123-4567
   - Speaks with Nurse Maria Santos
   - **Learns**: John had allergic reaction, already referred to hospital
   - **Action**: Rushes to meet ambulance/go to hospital

4. **Hospital Coordination**
   - Meets medical team at hospital
   - Provides John's medical history and allergy information
   - School clinic records help medical team understand incident
   - John receives proper treatment

5. **Follow-up Communication**
   - Updates school on John's condition
   - Discusses prevention measures with school nurse
   - Reviews John's allergy action plan
   - Ensures school records are updated

**What Mrs. Cruz Experiences:**
- Immediate notification of emergency
- Clear, professional communication
- Direct contact information provided
- Seamless coordination between school and hospital
- Confidence in school's emergency response

---

## 👨‍💼 **SCENARIO 6: ADMIN - System Management**

### **User**: IT Administrator Mr. Jose Ramos
### **Situation**: Monitoring system performance and notifications

**Step-by-Step Process:**

1. **Daily System Check**
   - Logs into admin dashboard
   - Reviews notification statistics
   - **Today's Summary**: 15 routine visits, 2 emergency visits
   - **Email Status**: 17 emails sent, 16 delivered, 1 failed

2. **Emergency Alert Review**
   - Sees 2 emergency notifications from today
   - **Case 1**: John Cruz - Allergic reaction (Resolved)
   - **Case 2**: Maria Santos - Severe headache (Ongoing)
   - Both properly escalated to Principal

3. **System Performance**
   - Checks email logs: 98% delivery rate
   - Reviews notification response times: Average 30 seconds
   - Monitors database performance: All queries under 2 seconds

4. **User Management**
   - Reviews active users: 450 students, 25 faculty, 3 clinic staff, 5 admins
   - Checks for any access issues or failed logins
   - Updates user permissions as needed

5. **Maintenance Tasks**
   - Runs database cleanup for old notifications (>30 days)
   - Updates email templates if needed
   - Monitors server resources and performance
   - Prepares weekly system report

**What Mr. Ramos Manages:**
- Overall system health and performance
- Email delivery and notification systems
- User access and security
- Data backup and maintenance
- System optimization and updates

---

## 📊 **SCENARIO SUMMARY**

| User Type | Primary Experience | Key Benefits |
|-----------|-------------------|--------------|
| **Clinic Staff** | Simple 2-option workflow | Streamlined emergency/routine handling |
| **Admin** | Immediate emergency alerts | Fast response to critical situations |
| **Adviser** | Routine student notifications | Stay informed about student health |
| **Student** | Quick, professional care | Efficient medical service |
| **Parent** | Emergency notifications | Peace of mind and quick response |
| **IT Admin** | System monitoring | Reliable, scalable platform |

## 🎯 **SUCCESS METRICS**

- **Emergency Response Time**: < 2 minutes from visit to admin notification
- **Email Delivery Rate**: > 95% successful delivery
- **User Satisfaction**: Streamlined workflow for all user types
- **System Reliability**: 99.9% uptime for critical notifications
- **Data Accuracy**: Complete audit trail for all medical visits

---

**These scenarios demonstrate how the Emergency/Routine workflow system serves each user type effectively, ensuring appropriate communication, quick emergency response, and comprehensive medical record management.**