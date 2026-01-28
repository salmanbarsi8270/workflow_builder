import React from 'react';
import { KPICard } from './components/KPICard';
import { WikiCard } from './components/WikiCard';
import { Container } from './components/Container';
import { GridContainer } from './components/GridContainer';
import { StatsGrid } from './components/StatsGrid';
import { DataTable } from './components/DataTable';
import { StatsList } from './components/StatsList';
import { ChartCard } from './components/ChartCard';
import { InfoCard } from './components/InfoCard';
import { EmptyState } from './components/EmptyState';
import { ProgressCard } from './components/ProgressCard';
import { TimelineCard } from './components/TimelineCard';
import { ComparisonCard } from './components/ComparisonCard';
import { SummaryCard } from './components/SummaryCard';
import { ActivityFeed } from './components/ActivityFeed';
import { Heading } from './components/Heading';
import { CodeCard } from './components/CodeCard';
import { StepIndicator } from './components/StepIndicator';
import { StatusTag } from './components/StatusTag';
import { TextCard } from './components/TextCard';
import { CalendarCard } from './components/CalendarCard';
import { GenButton, GenBadge, GenAccordion, GenAvatar, GenTabs } from './components/ShadcnPrimitives';

// Internal Text Component
const Text = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={className}>{children}</span>
);

// Registry Map
export const componentRegistry: Record<string, React.ComponentType<any>> = {
    'text': Text,
    'grid-container': GridContainer,
    'container': Container,
    'wiki-card': WikiCard,
    'kpi-card': KPICard,
    'stats-grid': StatsGrid,
    'data-table': DataTable,
    'stats-list': StatsList,
    'chart-card': ChartCard,
    'info-card': InfoCard,
    'empty-state': EmptyState,
    'progress-card': ProgressCard,
    'timeline-card': TimelineCard,
    'comparison-card': ComparisonCard,
    'summary-card': SummaryCard,
    'activity-feed': ActivityFeed,
    'heading': Heading,
    'code-card': CodeCard,
    'step-indicator': StepIndicator,
    'status-tag': StatusTag,
    'text-card': TextCard,
    'calendar-card': CalendarCard,
    'button': GenButton,
    'badge': GenBadge,
    'accordion': GenAccordion,
    'avatar': GenAvatar,
    'tabs': GenTabs,
};
