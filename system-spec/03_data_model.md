# Data Model

Resolutions
- id
- name
- purpose
- constraints
- success_signals
- failure_modes
- non_goals
- status
- created_at

JournalEntries
- id
- timestamp
- raw_text
- linked_resolution_ids

AIInterpretations
- id
- journal_entry_id
- detected_activity
- momentum_signal
- risk_flags
- suggested_adjustments

DailyActivity
- date
- resolution_id
- activity_level

WeeklySummaries
- week_start
- resolution_id
- engagement_score
- momentum_trend
- summary_text
