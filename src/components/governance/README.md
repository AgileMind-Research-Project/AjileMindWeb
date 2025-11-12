# Governance Components

## Overview
Components for project governance, risk management, and executive dashboards.

## Components

### RiskPanel.tsx
Display and manage project risks.

```tsx
import { RiskPanel } from '@/components/governance/RiskPanel'

<RiskPanel 
  projectId="project-123"
  showAIDetected={true}
/>
```

**Features:**
- Risk matrix visualization
- AI-detected risks
- Risk scoring
- Mitigation plans
- Status tracking
- Trend analysis

### MetricsDashboard.tsx
Key project metrics and KPIs.

```tsx
import { MetricsDashboard } from '@/components/governance/MetricsDashboard'

<MetricsDashboard 
  projectId="project-123"
  timeframe="last-30-days"
/>
```

**Features:**
- Velocity tracking
- Lead time metrics
- Cycle time
- Deployment frequency
- Bug rates
- Team productivity

### CICDVisualizer.tsx
CI/CD pipeline status and visualization.

```tsx
import { CICDVisualizer } from '@/components/governance/CICDVisualizer'

<CICDVisualizer 
  repositories={repos}
  realtime={true}
/>
```

**Features:**
- Pipeline status
- Build history
- Deployment timeline
- Success rates
- Performance metrics
- Integration with GitHub/GitLab

### DelayAnalytics.tsx
Analyze and predict project delays.

```tsx
import { DelayAnalytics } from '@/components/governance/DelayAnalytics'

<DelayAnalytics projectId="project-123" />
```

**Features:**
- Delay detection
- Root cause analysis
- Impact assessment
- Forecasting
- Recommendations
- Historical patterns

### BudgetTracker.tsx
Track project budget and costs.

```tsx
import { BudgetTracker } from '@/components/governance/BudgetTracker'

<BudgetTracker 
  projectId="project-123"
  showForecasts={true}
/>
```

**Features:**
- Budget vs actual
- Cost breakdown
- Burn rate
- Forecast to completion
- Alerts and notifications
- Resource costs

---

**Related:** [Charts](../charts/README.md), [AI Components](../ai/README.md)
