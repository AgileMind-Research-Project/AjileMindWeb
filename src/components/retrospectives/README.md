# Retrospective Components

## Overview
Components for sprint retrospectives, feedback collection, and analysis.

## Components

### RetroBoard.tsx
Interactive retrospective board (What went well, What needs improvement, Action items).

```tsx
import { RetroBoard } from '@/components/retrospectives/RetroBoard'

<RetroBoard 
  retrospectiveId="retro-123"
  mode="collaborate"
/>
```

**Features:**
- Three-column layout
- Sticky note cards
- Real-time collaboration
- Voting system
- Grouping similar items
- Anonymous feedback option

### FeedbackCard.tsx
Individual feedback item component.

```tsx
import { FeedbackCard } from '@/components/retrospectives/FeedbackCard'

<FeedbackCard 
  feedback={feedbackItem}
  votes={5}
  onVote={() => voteFeedback(feedbackItem.id)}
/>
```

**Features:**
- Feedback content
- Vote counter
- Author (if not anonymous)
- Category badge
- Action button

### SentimentAnalysis.tsx
Visualize team sentiment from feedback.

```tsx
import { SentimentAnalysis } from '@/components/retrospectives/SentimentAnalysis'

<SentimentAnalysis retrospectiveId="retro-123" />
```

**Features:**
- Sentiment score
- Emotion distribution
- Trend comparison
- Word cloud
- Key concerns

### ActionPlanGenerator.tsx
Generate action plans from retrospective.

```tsx
import { ActionPlanGenerator } from '@/components/retrospectives/ActionPlanGenerator'

<ActionPlanGenerator 
  retrospectiveId="retro-123"
  onGenerate={(plan) => saveActionPlan(plan)}
/>
```

**Features:**
- AI-generated actions
- Priority sorting
- Owner assignment
- Timeline creation
- Integration with sprints

### RetroTimeline.tsx
Historical retrospective view.

```tsx
import { RetroTimeline } from '@/components/retrospectives/RetroTimeline'

<RetroTimeline retrospectives={pastRetros} />
```

**Features:**
- Chronological display
- Sentiment trends
- Recurring themes
- Action item tracking
- Improvement metrics

---

**Related:** [AI Components](../ai/README.md), [Charts](../charts/README.md)
