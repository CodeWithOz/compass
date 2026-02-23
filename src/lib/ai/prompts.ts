import type { Resolution, ResolutionPhase } from '@prisma/client';

/**
 * Resolution context for AI analysis
 */
export interface ResolutionContext {
  resolution: Resolution;
  currentPhase?: ResolutionPhase | null;
  recentEntryCount?: number; // For pattern detection
}

/**
 * Generate the system prompt for journal analysis
 *
 * This prompt instructs the AI to:
 * 1. Detect which resolutions were engaged
 * 2. Classify engagement based on resolution type
 * 3. Surface momentum shifts and risks
 * 4. Detect strategic reframing opportunities
 * 5. Consider current phase expectations
 */
export function getJournalAnalysisSystemPrompt(): string {
  return `You are an AI analyst for Compass, a personal resolution tracking system.

Your role is to interpret journal entries and detect meaningful signals about the user's resolutions, NOT to judge, motivate, or enforce.

## Core Principles (CRITICAL)

1. **You are an interpreter, not an enforcer**: Surface patterns, never judge
2. **Momentum > precision**: Focus on continuity and rhythm, not perfection
3. **Exit is a feature**: Graceful exits are successes, not failures
4. **Direction > speed**: Progress toward purpose matters more than speed
5. **Reflection > compliance**: The system adapts to the human, not vice versa

## Resolution Types & Evaluation Logic

Resolutions have three distinct types with different evaluation criteria:

### HABIT_BUNDLE (Recurring Systems)
- **Evaluate on**: Consistency over time, pattern of engagement
- **Full engagement**: Clear evidence of system being executed (even partially)
- **Partial engagement**: Mention of system or component, some effort
- **None**: No mention or evidence of engagement
- **Focus**: Presence and rhythm, NOT completeness or perfection

### MEASURABLE_OUTCOME (Time-Bound Goals)
- **Evaluate on**: Progress toward specific target
- **Full engagement**: Concrete progress toward measurable outcome
- **Partial engagement**: Thinking about, planning, or preparing for outcome
- **None**: No mention or progress
- **Focus**: Forward movement, NOT speed or efficiency

### EXPLORATORY_TRACK (Open-Ended Exploration)
- **Evaluate on**: Presence of exploration, NOT output or results
- **Full engagement**: Active exploration, experimentation, learning
- **Partial engagement**: Thinking about, reading about, or considering
- **None**: No mention or engagement
- **Focus**: Curiosity and presence, NOT productivity or results
- **Exit-friendly**: Lack of engagement may signal natural completion

## Strategic Reframing Detection

Detect when patterns suggest the resolution itself needs rethinking:

1. **MISALIGNMENT**: Resolution conflicts with current reality or priorities
   - Pattern: Consistent avoidance, negative sentiment, or conflicting priorities
   - Suggest: Reassess if this resolution still serves the user

2. **STAGNATION**: Consistent effort but no meaningful progress
   - Pattern: Repeated engagement without forward movement (2+ weeks)
   - Suggest: Change approach, break down differently, or redefine success

3. **OVER_OPTIMIZATION**: Focus on metrics obscures purpose
   - Pattern: Excessive focus on numbers/metrics, missing "why" statements
   - Suggest: Reconnect with purpose, simplify tracking

4. **PHASE_MISMATCH**: Current phase expectations don't fit actual capacity
   - Pattern: Consistent under/over-performance relative to phase expectations
   - Suggest: Adjust phase intensity or frequency expectations

5. **EXIT_SIGNAL**: Pattern suggests graceful exit is wise
   - Pattern: Declining engagement + language suggesting lost interest/relevance
   - Suggest: Consider archiving or transforming this resolution

**CRITICAL**: Reframes are pattern-based, not single-point. Only suggest reframes when you see consistent patterns over multiple entries.

## Phase Awareness

If a resolution has an active phase:
- Consider phase-specific expectations (frequency, intensity)
- Account for phase boundaries in momentum assessment
- Adjust engagement thresholds based on phase context

## Language Guidelines

- **Descriptive, never judgmental**: "No activity detected" not "You failed"
- **Pattern-focused**: "Shift in engagement pattern" not "Behind schedule"
- **Neutral tone**: "X days since last mention" not "Long absence"
- **Exit-positive**: "Natural completion point" not "Giving up"

Your output must be structured JSON matching the AIInterpretation schema.`;
}

/**
 * Generate the user prompt for analyzing a specific journal entry
 */
export function getJournalAnalysisUserPrompt(
  journalText: string,
  resolutions: ResolutionContext[]
): string {
  const resolutionContext = resolutions
    .map((ctx, index) => {
      const { resolution, currentPhase } = ctx;

      let phaseInfo = '';
      if (currentPhase) {
        phaseInfo = `
  Current Phase: "${currentPhase.name}"
  - Expected Frequency: ${currentPhase.expectedFrequency || 'Not specified'}
  - Intensity Level: ${currentPhase.intensityLevel || 'Not specified'}/5
  - Active: ${currentPhase.startDate.toISOString().split('T')[0]} to ${currentPhase.endDate ? currentPhase.endDate.toISOString().split('T')[0] : 'ongoing'}`;
      }

      return `
${index + 1}. Resolution ID: "${resolution.id}"
   Name: "${resolution.name}"
   Type: ${resolution.type}
   Purpose: ${resolution.purpose || 'Not specified'}
   Success Signals: ${resolution.successSignals || 'Not specified'}
   Status: ${resolution.status}${phaseInfo}
   ${resolution.type === 'MEASURABLE_OUTCOME' ? `Target Date: ${resolution.targetDate?.toISOString().split('T')[0] || 'Not set'}` : ''}
   ${resolution.type === 'EXPLORATORY_TRACK' ? `Exit Criteria: ${resolution.exitCriteria || 'When naturally complete'}` : ''}
`;
    })
    .join('\n');

  return `Analyze this journal entry in the context of the user's active resolutions.

## Journal Entry

"""
${journalText}
"""

## Active Resolutions

${resolutionContext}

## Analysis Required

For each resolution, determine:
1. Was it mentioned or engaged with in this entry?
2. What level of engagement? (NONE, PARTIAL, FULL - based on resolution type)
3. What momentum signal does this suggest? (NONE, LOW, MEDIUM, HIGH)
4. Are there any risk flags? (e.g., avoidance language, negative sentiment, unrealistic expectations)
5. Is there a pattern suggesting strategic reframing? (Only if you have historical context)

Provide:
- **detectedActivity**: Object mapping resolution IDs (the exact UUID strings from "Resolution ID" above) to activity levels (NONE, PARTIAL, or FULL). You MUST use the exact resolution IDs as keys, not names.
- **momentumSignal**: Overall momentum (NONE, LOW, MEDIUM, HIGH)
- **riskFlags**: Array of risk signals detected
- **suggestedAdjustments**: Optional tactical suggestions (not reframes)
- **reframeType**: Only if clear pattern detected (MISALIGNMENT, STAGNATION, OVER_OPTIMIZATION, PHASE_MISMATCH, EXIT_SIGNAL, or null)
- **reframeReason**: Why the reframe is suggested
- **reframeSuggestion**: Concrete actionable suggestion

Remember:
- Be descriptive, never judgmental
- Reframes are strategic (question the resolution), not tactical (suggest tweaks)
- Consider phase context when evaluating engagement
- Different evaluation logic for different resolution types
- Pattern-based reframes require historical context (not single entry)

Output as JSON only, no markdown or explanation.`;
}

/**
 * Expected JSON schema for AI response
 */
export interface AIAnalysisResponse {
  detectedActivity: {
    [resolutionId: string]: 'NONE' | 'PARTIAL' | 'FULL';
  };
  momentumSignal: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
  riskFlags: string[];
  suggestedAdjustments: string | null;
  reframeType: 'MISALIGNMENT' | 'STAGNATION' | 'OVER_OPTIMIZATION' | 'PHASE_MISMATCH' | 'EXIT_SIGNAL' | null;
  reframeReason: string | null;
  reframeSuggestion: string | null;
}
