# Chart Components

## Overview
Data visualization components using Recharts library.

## Components

### VelocityChart.tsx
Team velocity over time.

```tsx
import { VelocityChart } from '@/components/charts/VelocityChart'

<VelocityChart 
  data={velocityData}
  timeframe="last-6-sprints"
/>
```

### BurndownChart.tsx
Sprint burndown visualization.

```tsx
import { BurndownChart } from '@/components/charts/BurndownChart'

<BurndownChart 
  sprintId="sprint-123"
  showIdeal={true}
/>
```

### CumulativeFlowChart.tsx
Work in progress visualization.

```tsx
import { CumulativeFlowChart } from '@/components/charts/CumulativeFlowChart'

<CumulativeFlowChart 
  sprintId="sprint-123"
  colors={customColors}
/>
```

### TeamPerformanceChart.tsx
Team member performance metrics.

```tsx
import { TeamPerformanceChart } from '@/components/charts/TeamPerformanceChart'

<TeamPerformanceChart 
  teamId="team-123"
  metrics={['velocity', 'quality', 'collaboration']}
/>
```

## Features

- Interactive tooltips
- Zoom and pan
- Export as image
- Responsive design
- Custom color schemes
- Animation effects
- Real-time updates

---

**Related:** [Governance Components](../governance/README.md)
