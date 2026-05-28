@startuml Use Case Diagram

left to right direction
skinparam packageStyle rectangle
skinparam actorStyle awesome

actor Admin
actor "Clinic Staff" as Staff
actor Adviser
actor Student

rectangle "Authentication" {
    usecase "Login" as UC_LOGIN
    usecase "Logout" as UC_LOGOUT
    usecase "Change Password" as UC_CHGPWD
    usecase "View Own Profile" as UC_ME
}

rectangle "User Management" {
    usecase "Create User Account" as UC_CREATEUSER
    usecase "Update User" as UC_UPDATEUSER
    usecase "Deactivate / Activate User" as UC_TOGGLEUSER
    usecase "Reset User Password" as UC_RESETPWD
    usecase "Delete User" as UC_DELETEUSER
    usecase "View All Users" as UC_VIEWUSERS
}

rectangle "Academic Structure" {
    usecase "Manage School Years" as UC_SCHOOLYEAR
    usecase "Manage Grade Levels" as UC_GRADELEVEL
    usecase "Manage Sections" as UC_SECTIONS
    usecase "Assign Adviser to Section" as UC_ASSIGNADVISER
    usecase "View Section Students" as UC_SECTIONSTUDENTS
}

rectangle "Grade Promotion" {
    usecase "View Promotion Summary" as UC_PROMSUMMARY
    usecase "Copy Sections to New Year" as UC_COPYSECTIONS
    usecase "Bulk Promote Students" as UC_BULKPROMOTE
}

rectangle "Student Management" {
    usecase "Create Student Account" as UC_CREATESTUDENT
    usecase "View Student Profile" as UC_VIEWSTUDENT
    usecase "Update Student Profile" as UC_UPDATESTUDENT
    usecase "Search Students" as UC_SEARCHSTUDENT
    usecase "View All Students" as UC_ALLSTUDENTS
    usecase "Scan Student QR Code" as UC_QRSCAN
}

rectangle "Medical Records" {
    usecase "View Medical Data" as UC_VIEWMEDICAL
    usecase "Update Medical Data" as UC_UPDATEMEDICAL
    usecase "Record Medical Visit" as UC_RECORDVISIT
    usecase "View Medical Visits" as UC_VIEWVISITS
    usecase "View Visit History" as UC_VISITHISTORY
    usecase "Record Vitals" as UC_VITALS
}

rectangle "SHDF (Student Health Data Form)" {
    usecase "Submit Basic Info (Stage 1)" as UC_SHDFBASIC
    usecase "Submit Comprehensive Form (Stage 2)" as UC_SHDFCOMP
    usecase "View SHDF Status" as UC_SHDFSTATUS
    usecase "View SHDF Record" as UC_SHDFVIEW
}

rectangle "Dashboard & Reports" {
    usecase "View Admin Dashboard" as UC_ADMINDASH
    usecase "View Clinic Overview" as UC_CLINICDASH
    usecase "View Adviser Dashboard" as UC_ADVISERDASH
    usecase "View Student Dashboard" as UC_STUDENTDASH
    usecase "View Health Risk Visualization" as UC_HEALTHRISK
    usecase "View Staff Reports & Analytics" as UC_REPORTS
    usecase "View Health Heatmap" as UC_HEATMAP
}

rectangle "Wellness Badges" {
    usecase "View Wellness Streak & Badges" as UC_BADGES
    usecase "View Badge Notifications" as UC_BADGENOTIF
    usecase "Generate AI Badge Narrative" as UC_BADGEAI
}

rectangle "Notifications" {
    usecase "View Adviser Notifications" as UC_ADVISERNOTIF
    usecase "View Admin Notifications" as UC_ADMINNOTIF
    usecase "Mark Notification as Read" as UC_MARKREAD
}

rectangle "System Settings & Logs" {
    usecase "Manage System Settings" as UC_SETTINGS
    usecase "View Activity Logs" as UC_ACTLOGS
    usecase "View Audit Logs" as UC_AUDITLOGS
    usecase "Manage Backups" as UC_BACKUP
}

' Admin
Admin --> UC_LOGIN
Admin --> UC_CREATEUSER
Admin --> UC_UPDATEUSER
Admin --> UC_TOGGLEUSER
Admin --> UC_RESETPWD
Admin --> UC_DELETEUSER
Admin --> UC_VIEWUSERS
Admin --> UC_SCHOOLYEAR
Admin --> UC_GRADELEVEL
Admin --> UC_SECTIONS
Admin --> UC_ASSIGNADVISER
Admin --> UC_SECTIONSTUDENTS
Admin --> UC_PROMSUMMARY
Admin --> UC_COPYSECTIONS
Admin --> UC_BULKPROMOTE
Admin --> UC_CREATESTUDENT
Admin --> UC_ADMINDASH
Admin --> UC_HEALTHRISK
Admin --> UC_SETTINGS
Admin --> UC_ACTLOGS
Admin --> UC_AUDITLOGS
Admin --> UC_BACKUP
Admin --> UC_ADMINNOTIF

' Clinic Staff
Staff --> UC_LOGIN
Staff --> UC_ALLSTUDENTS
Staff --> UC_SEARCHSTUDENT
Staff --> UC_QRSCAN
Staff --> UC_VIEWSTUDENT
Staff --> UC_VIEWMEDICAL
Staff --> UC_UPDATEMEDICAL
Staff --> UC_RECORDVISIT
Staff --> UC_VIEWVISITS
Staff --> UC_VITALS
Staff --> UC_CLINICDASH
Staff --> UC_REPORTS

' Adviser
Adviser --> UC_LOGIN
Adviser --> UC_ADVISERDASH
Adviser --> UC_HEATMAP
Adviser --> UC_SECTIONSTUDENTS
Adviser --> UC_VIEWSTUDENT
Adviser --> UC_VIEWMEDICAL
Adviser --> UC_VISITHISTORY
Adviser --> UC_ADVISERNOTIF

' Student
Student --> UC_LOGIN
Student --> UC_CHGPWD
Student --> UC_ME
Student --> UC_VIEWSTUDENT
Student --> UC_STUDENTDASH
Student --> UC_VIEWMEDICAL
Student --> UC_VISITHISTORY
Student --> UC_SHDFBASIC
Student --> UC_SHDFCOMP
Student --> UC_SHDFSTATUS
Student --> UC_SHDFVIEW
Student --> UC_BADGES
Student --> UC_BADGENOTIF
Student --> UC_BADGEAI
Student --> UC_MARKREAD

' Shared
Admin --> UC_LOGOUT
Staff --> UC_LOGOUT
Adviser --> UC_LOGOUT
Student --> UC_LOGOUT

Admin --> UC_VIEWSTUDENT
Admin --> UC_SEARCHSTUDENT
Admin --> UC_VIEWVISITS

@enduml
