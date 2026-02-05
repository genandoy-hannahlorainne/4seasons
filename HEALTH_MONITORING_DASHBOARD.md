# Adviser Class Health Monitoring Dashboard

## Overview
The Health Monitoring Dashboard provides advisers with a visual heat map of clinic visits and health trends within their advisory class. This enables proactive health management and early detection of potential outbreaks.

## Features Implemented

### 1. Health Heat Map
- **Visual Calendar View**: Daily clinic visit percentages displayed in a color-coded grid
- **Risk Levels**: 
  - Gray (0%): No visits
  - Blue (1-5%): Low activity
  - Yellow (6-10%): Moderate activity
  - Orange (11-15%): High activity
  - Red (>15%): Critical - potential outbreak

### 2. Automated Alerts
- **Outbreak Detection**: Automatically flags days when >15% of class visits clinic with similar symptoms
- **Trending Symptoms**: Identifies health issues affecting >10% of students
- **Actionable Recommendations**: Provides specific guidance (e.g., "Consider deep cleaning classroom")

### 3. Trending Symptoms Analysis
- **Top 5 Symptoms**: Ranked list of most common health issues
- **Student Impact**: Shows number and percentage of students affected
- **Visit Frequency**: Tracks total visits per symptom category

### 4. Detailed Day View
- **Click-to-Expand**: Click any day on the heat map for detailed breakdown
- **Symptom Distribution**: See which symptoms occurred on specific days
- **Student Names**: View which students visited clinic
- **Statistics**: Total visits, unique students, and percentage of class

### 5. Symptom Categorization
Automatic categorization of complaints into:
- **Respiratory**: Cough, cold, flu, fever, sore throat
- **Gastrointestinal**: Stomach issues, nausea, vomiting
- **Headache**: Headaches, migraines, dizziness
- **Injury**: Wounds, cuts, bruises, sprains
- **Allergic/Skin**: Allergies, rashes, skin conditions
- **Other**: Uncategorized symptoms

### 6. Time Range Selection
- Last 7 days (default)
- Last 14 days
- Last 30 days

## Use Case Scenario

### Monday Morning Check
**Scenario**: A Grade 10 adviser logs in on Monday morning

**What They See**:
1. **Alert Banner** (if applicable):
   ```
   ⚠️ 15% of class visited clinic on Friday with Respiratory symptoms
   Recommendation: Consider deep cleaning classroom and monitoring for spread
   ```

2. **Heat Map**: Visual representation showing Friday highlighted in orange/red

3. **Trending Symptoms**:
   ```
   1. Respiratory - 6 students (15%) • 8 visits
   2. Headache - 3 students (7.5%) • 3 visits
   3. Gastrointestinal - 2 students (5%) • 2 visits
   ```

4. **Action Taken**: 
   - Adviser clicks on Friday's cell to see detailed breakdown
   - Views which students were affected
   - Coordinates with janitorial staff for deep cleaning
   - Monitors students for follow-up symptoms

## Technical Implementation

### Backend API
**Endpoint**: `backend/api/adviser/get-health-heatmap.php`

**Features**:
- Fetches clinic visits for adviser's class
- Groups visits by date and symptom
- Calculates percentages and trends
- Generates automated alerts
- Categorizes symptoms intelligently

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "advisory_class": "Grade 10 - A",
    "total_students": 40,
    "date_range": {
      "start": "2026-01-29",
      "end": "2026-02-05",
      "days": 7
    },
    "visits_by_date": [
      {
        "date": "2026-02-01",
        "total_visits": 8,
        "unique_students": 6,
        "percentage": 15.0,
        "symptoms": {
          "Respiratory": {
            "count": 6,
            "students": ["John Doe", "Jane Smith", ...]
          }
        }
      }
    ],
    "trending_symptoms": [...],
    "high_risk_days": [...],
    "alerts": [...]
  }
}
```

### Frontend Component
**Location**: `frontend/src/app/features/dashboard/adviser/health-monitoring/health-monitoring.component.ts`

**Key Features**:
- Responsive grid layout
- Interactive heat map cells
- Real-time data updates
- Color-coded risk visualization
- Detailed modal views

### Service Integration
**Service**: `AdviserService`
**Method**: `getHealthHeatmap(days: number)`

### Routing
**Path**: `/dashboard/adviser/health-monitoring`
**Guard**: Role-based (Adviser only)

## Navigation

### Main Navigation
Added to adviser layout navigation bar:
```
Dashboard | Health Monitor | Alerts | My Class
```

### Quick Access
Added promotional card on main adviser dashboard with direct link to Health Monitor

## Benefits

### For Advisers
- **Early Detection**: Spot potential outbreaks before they spread
- **Data-Driven Decisions**: Make informed choices about classroom management
- **Student Welfare**: Better monitor and support student health
- **Coordination**: Facilitate communication with health staff and janitorial services

### For School Administration
- **Preventive Action**: Reduce spread of illnesses through early intervention
- **Resource Planning**: Allocate cleaning and health resources effectively
- **Documentation**: Track health trends for reporting and analysis
- **Compliance**: Demonstrate proactive health monitoring

### For Students
- **Healthier Environment**: Benefit from proactive cleaning and monitoring
- **Reduced Absences**: Fewer students affected by preventable spread
- **Better Care**: Advisers aware of health patterns can provide better support

## Future Enhancements

### Potential Additions
1. **Email Notifications**: Automatic alerts when thresholds are exceeded
2. **Comparison View**: Compare current week to previous weeks
3. **Export Reports**: Generate PDF reports for administration
4. **Multi-Class View**: For advisers managing multiple sections
5. **Predictive Analytics**: ML-based outbreak prediction
6. **Integration with Attendance**: Correlate health data with absence patterns
7. **Parent Communication**: Automated health advisories to parents
8. **Seasonal Trends**: Year-over-year comparison of health patterns

## Testing Recommendations

### Test Scenarios
1. **No Data**: Verify empty state displays correctly
2. **Low Activity**: Test with 1-5% visit rate
3. **High Activity**: Test with >15% visit rate (should trigger alerts)
4. **Multiple Symptoms**: Verify categorization works correctly
5. **Date Range Changes**: Test 7, 14, and 30-day views
6. **Click Interactions**: Verify day detail modal works
7. **Responsive Design**: Test on mobile and tablet devices

### Sample Test Data
Create test visits with:
- Various dates within last 7 days
- Different symptom types
- Multiple students on same day
- Same student multiple visits

## Maintenance Notes

### Database Dependencies
- Requires `medical_visits` table with visit_datetime, chief_complaint, diagnosis
- Requires `students` table with grade_level, section
- Requires `users` table with adviser grade_level and section

### Performance Considerations
- Query optimized with date range filtering
- Results grouped at database level
- Consider caching for frequently accessed data
- Index on visit_datetime recommended

### Security
- Authentication required (adviser role)
- Data filtered by adviser's assigned class only
- No cross-class data exposure
- SQL injection protection via prepared statements

## Support and Documentation

### For Advisers
- User guide available in system help section
- Video tutorial recommended for onboarding
- Quick reference card for alert interpretation

### For Administrators
- Setup guide for initial configuration
- Troubleshooting common issues
- Performance monitoring guidelines

## Conclusion

The Health Monitoring Dashboard transforms raw clinic visit data into actionable insights, enabling advisers to proactively manage classroom health and prevent the spread of illnesses. The visual heat map makes it easy to spot patterns at a glance, while detailed breakdowns provide the information needed for informed decision-making.
