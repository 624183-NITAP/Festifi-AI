'use client';

import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { applyBudgetOptimization, generateBudgetOptimization } from '@/domain/budget';
import {
  loadActiveEventPlanState,
  saveEventPlanState,
} from '@/domain/persistence';
import { calculateDeadline, deriveTasksFromEvent } from '@/domain/timeline';
import {
  BudgetOptimizationProposal,
  EventDetails,
  EventPlanState,
  ExpenseItem,
  GeneratedEventPlan,
  GuestRecord,
  TimelineTask,
  VendorRecord,
} from '@/domain/types';
import { AICopilotModal } from '@/components/copilot/AICopilotModal';
import { BudgetManager } from '@/components/budget/BudgetManager';
import { BudgetOptimizerModal } from '@/components/budget/BudgetOptimizerModal';
import { CreateEventModal } from '@/components/creation/CreateEventModal';
import { ExportModal } from '@/components/export/ExportModal';
import { GuestManager } from '@/components/guests/GuestManager';
import { Header } from '@/components/navigation/Header';
import { HeroOverview } from '@/components/overview/HeroOverview';
import { InvitationPreviewModal } from '@/components/invitation/InvitationPreviewModal';
import { JudgeGuideModal } from '@/components/demo/JudgeGuideModal';
import { ScenarioSimulator } from '@/components/scenarios/ScenarioSimulator';
import { TimelineManager } from '@/components/timeline/TimelineManager';
import { VendorManager } from '@/components/vendors/VendorManager';
import { defaultShowcaseGuests } from '@/domain/guests';
import { createDefaultEventPlanState } from '@/domain/mockData';

export default function FestiFiApp() {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'optimizer' | 'scenarios' | 'timeline' | 'vendors' | 'guests'>('overview');
  const [isAiLive, setIsAiLive] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState<boolean>(false);
  const [showCopilotModal, setShowCopilotModal] = useState<boolean>(false);
  const [showInvitationModal, setShowInvitationModal] = useState<boolean>(false);
  const [showJudgeModal, setShowJudgeModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Welcome to FestiFi AI');

  // Application State
  const [state, setState] = useState<EventPlanState>(() => {
    const saved = loadActiveEventPlanState();
    if (saved) {
      return {
        ...saved,
        guests: saved.guests && saved.guests.length > 0 ? saved.guests : defaultShowcaseGuests,
      };
    }

    return createDefaultEventPlanState();
  });

  // Check health and AI live connection on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setIsAiLive(data.aiMode?.includes('Live'));
      })
      .catch(() => {
        setIsAiLive(false);
      });
  }, []);

  // Autosave state on change with persistence
  useEffect(() => {
    saveEventPlanState(state);
  }, [state]);

  const handleUpdateExpenses = (newExpenses: ExpenseItem[]) => {
    setState((prev) => ({
      ...prev,
      expenses: newExpenses,
      event: { ...prev.event, updatedAt: new Date().toISOString() },
    }));
    setStatusMessage('Updated budget expenses saved.');
  };

  const handleUpdateTasks = (newTasks: TimelineTask[]) => {
    setState((prev) => ({
      ...prev,
      tasks: newTasks,
      event: { ...prev.event, updatedAt: new Date().toISOString() },
    }));
    setStatusMessage('Updated timeline tasks saved.');
  };

  const handleUpdateVendors = (newVendors: VendorRecord[]) => {
    setState((prev) => ({
      ...prev,
      vendors: newVendors,
      event: { ...prev.event, updatedAt: new Date().toISOString() },
    }));
    setStatusMessage('Updated vendor records saved.');
  };

  const handleUpdateGuests = (newGuests: GuestRecord[]) => {
    setState((prev) => ({
      ...prev,
      guests: newGuests,
      event: { ...prev.event, updatedAt: new Date().toISOString() },
    }));
    setStatusMessage('Updated guest list and RSVP status saved.');
  };

  const handleCreateNewEvent = (
    newEvent: EventDetails,
    generatedPlan?: GeneratedEventPlan,
    meta?: { provider: string; isLive: boolean }
  ) => {
    const derivedTasks = deriveTasksFromEvent(newEvent);

    let initialExpenses: ExpenseItem[] = [];
    let initialTasks: TimelineTask[] = derivedTasks;
    let initialIdeas: GeneratedEventPlan | null = null;

    if (generatedPlan && generatedPlan.recommendedExpenses?.length > 0) {
      initialExpenses = generatedPlan.recommendedExpenses.map((re, index) => ({
        id: `exp-${Date.now()}-${index + 1}`,
        categoryId: re.categoryId,
        name: re.name,
        estimatedCostMinor: re.estimatedCostMinor,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned' as const,
        priority: re.priority,
        notes: meta?.isLive
          ? 'Live AI generated allocation (Unverified market estimate)'
          : 'Benchmark template allocation based on guest count and regional averages',
      }));

      if (generatedPlan.recommendedTasks?.length > 0) {
        const aiTasks: TimelineTask[] = generatedPlan.recommendedTasks.map((rt, index) => ({
          id: `task-ai-${Date.now()}-${index + 1}`,
          title: rt.title,
          description: rt.description,
          category: rt.category,
          deadline: calculateDeadline(newEvent.targetDate, rt.daysBeforeEvent),
          daysBeforeEvent: rt.daysBeforeEvent,
          completed: false,
          completedAt: null,
          priority: rt.priority,
          dependencies: [],
          milestone: rt.milestone,
        }));
        initialTasks = [...derivedTasks, ...aiTasks];
      }

      initialIdeas = generatedPlan;
    } else {
      initialExpenses = [
        {
          id: `exp-${Date.now()}-1`,
          categoryId: 'venue',
          name: 'Primary Event Venue Space Rental',
          estimatedCostMinor: Math.round(newEvent.totalBudgetMinor * 0.35),
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
          notes: 'Space hold and setup hours',
        },
        {
          id: `exp-${Date.now()}-2`,
          categoryId: 'catering',
          name: 'Food & Beverage Service',
          estimatedCostMinor: Math.round(newEvent.totalBudgetMinor * 0.35),
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
          notes: `Estimated catering for ${newEvent.guestCount} guests`,
        },
        {
          id: `exp-${Date.now()}-3`,
          categoryId: 'entertainment',
          name: 'Music & Audio Equipment',
          estimatedCostMinor: Math.round(newEvent.totalBudgetMinor * 0.15),
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'nice_to_have',
          notes: 'Sound, playlist, or live performers',
        },
      ];
    }

    setState({
      event: newEvent,
      expenses: initialExpenses,
      tasks: initialTasks,
      vendors: [],
      guests: [],
      activeProposal: null,
      activeScenarioImpact: null,
      generatedIdeas: initialIdeas,
    });

    setActiveTab('overview');
    const sourceLabel = meta?.isLive ? 'Live Gemini AI' : 'Deterministic Template';
    setStatusMessage(`Created new celebration plan for "${newEvent.title}" (${sourceLabel})`);
  };

  const handleOpenOptimizer = () => {
    const proposal = generateBudgetOptimization(state.event, state.expenses);
    setState((prev) => ({ ...prev, activeProposal: proposal }));
    setShowOptimizerModal(true);
  };

  const handleAcceptProposal = () => {
    if (!state.activeProposal) return;
    const acceptedExpenses = applyBudgetOptimization(state.expenses, state.activeProposal);
    setState((prev) => ({
      ...prev,
      expenses: acceptedExpenses,
      activeProposal: null,
      event: { ...prev.event, updatedAt: new Date().toISOString() },
    }));
    setShowOptimizerModal(false);
    setStatusMessage('AI Budget Optimization proposal successfully applied!');
  };

  const handleRejectProposal = () => {
    setState((prev) => ({ ...prev, activeProposal: null }));
    setShowOptimizerModal(false);
    setStatusMessage('Optimization proposal rejected. Original budget preserved without changes.');
  };

  const handleApplyCopilotChanges = ({
    updatedEvent,
    updatedExpenses,
    updatedTasks,
    summaryMessage,
  }: {
    updatedEvent?: Partial<EventDetails>;
    updatedExpenses?: ExpenseItem[];
    updatedTasks?: TimelineTask[];
    summaryMessage: string;
  }) => {
    setState((prev) => ({
      ...prev,
      event: updatedEvent
        ? { ...prev.event, ...updatedEvent, updatedAt: new Date().toISOString() }
        : { ...prev.event, updatedAt: new Date().toISOString() },
      expenses: updatedExpenses || prev.expenses,
      tasks: updatedTasks || prev.tasks,
    }));
    setStatusMessage(`Copilot applied changes: ${summaryMessage}`);
  };

  const handleResetShowcase = () => {
    const pristineState: EventPlanState = createDefaultEventPlanState();
    setState(pristineState);
    saveEventPlanState(pristineState);
    setActiveTab('overview');
    setStatusMessage('Celebration reset to pristine Emerald Forest showcase demo.');
  };

  return (
    <div className="app-container" style={{ paddingBottom: '60px' }}>
      {/* Accessible live region for screen-reader announcements */}
      <div aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      {/* Main App Header */}
      <Header
        event={state.event}
        isAiLive={isAiLive}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenCopilotModal={() => setShowCopilotModal(true)}
        onOpenJudgeGuide={() => setShowJudgeModal(true)}
      />

      {/* Navigation Tabs Landmark */}
      <nav aria-label="Event Planner Sections" style={{ margin: '16px 0 24px' }}>
        <div className="nav-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            id="tab-overview"
            aria-selected={activeTab === 'overview'}
            aria-controls="panel-overview"
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>Overview & AI Concepts</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-budget"
            aria-selected={activeTab === 'budget'}
            aria-controls="panel-budget"
            className={`nav-tab ${activeTab === 'budget' ? 'active' : ''}`}
            onClick={() => setActiveTab('budget')}
          >
            <DollarSign size={16} aria-hidden="true" />
            <span>Smart Budget ({state.expenses.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-scenarios"
            aria-selected={activeTab === 'scenarios'}
            aria-controls="panel-scenarios"
            className={`nav-tab ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('scenarios')}
          >
            <TrendingUp size={16} aria-hidden="true" />
            <span>What-If Contingency Simulator</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-timeline"
            aria-selected={activeTab === 'timeline'}
            aria-controls="panel-timeline"
            className={`nav-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Calendar size={16} aria-hidden="true" />
            <span>Timeline Tasks ({state.tasks.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-vendors"
            aria-selected={activeTab === 'vendors'}
            aria-controls="panel-vendors"
            className={`nav-tab ${activeTab === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendors')}
          >
            <Briefcase size={16} aria-hidden="true" />
            <span>Vendors & Inquiries ({state.vendors.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-guests"
            aria-selected={activeTab === 'guests'}
            aria-controls="panel-guests"
            className={`nav-tab ${activeTab === 'guests' ? 'active' : ''}`}
            onClick={() => setActiveTab('guests')}
          >
            <Users size={16} aria-hidden="true" />
            <span>Guests & RSVPs ({(state.guests || []).length})</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area Landmark */}
      <main id="main-content">
        {activeTab === 'overview' && (
          <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
            <HeroOverview
              state={state}
              onNavigateTab={(tab) => {
                if (tab === 'optimizer') {
                  handleOpenOptimizer();
                } else {
                  setActiveTab(tab as typeof activeTab);
                }
              }}
            />
          </div>
        )}

        {activeTab === 'budget' && (
          <div role="tabpanel" id="panel-budget" aria-labelledby="tab-budget">
            <BudgetManager
              event={state.event}
              expenses={state.expenses}
              onUpdateExpenses={handleUpdateExpenses}
              onOpenOptimizerModal={handleOpenOptimizer}
            />
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div role="tabpanel" id="panel-scenarios" aria-labelledby="tab-scenarios">
            <ScenarioSimulator
              event={state.event}
              expenses={state.expenses}
              onApplyScenario={handleUpdateExpenses}
            />
          </div>
        )}

        {activeTab === 'timeline' && (
          <div role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline">
            <TimelineManager
              event={state.event}
              tasks={state.tasks}
              onUpdateTasks={handleUpdateTasks}
            />
          </div>
        )}

        {activeTab === 'vendors' && (
          <div role="tabpanel" id="panel-vendors" aria-labelledby="tab-vendors">
            <VendorManager
              event={state.event}
              vendors={state.vendors}
              onUpdateVendors={handleUpdateVendors}
            />
          </div>
        )}

        {activeTab === 'guests' && (
          <div role="tabpanel" id="panel-guests" aria-labelledby="tab-guests">
            <GuestManager
              event={state.event}
              guests={state.guests || []}
              onUpdateGuests={handleUpdateGuests}
              onOpenInvitationPreview={() => setShowInvitationModal(true)}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      {showOptimizerModal && state.activeProposal && (
        <BudgetOptimizerModal
          event={state.event}
          proposal={state.activeProposal}
          onAccept={handleAcceptProposal}
          onReject={handleRejectProposal}
        />
      )}

      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onCreateEvent={handleCreateNewEvent}
        />
      )}

      {showExportModal && (
        <ExportModal
          state={state}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showCopilotModal && (
        <AICopilotModal
          event={state.event}
          expenses={state.expenses}
          tasks={state.tasks}
          onClose={() => setShowCopilotModal(false)}
          onApplyChanges={handleApplyCopilotChanges}
        />
      )}

      {showInvitationModal && (
        <InvitationPreviewModal
          event={state.event}
          onClose={() => setShowInvitationModal(false)}
        />
      )}

      {showJudgeModal && (
        <JudgeGuideModal
          onClose={() => setShowJudgeModal(false)}
          onNavigateTab={(tab) => {
            if (tab === 'budget') {
              setActiveTab('budget');
            } else {
              setActiveTab(tab);
            }
          }}
          onOpenCopilot={() => setShowCopilotModal(true)}
          onOpenExport={() => setShowExportModal(true)}
          onResetShowcase={handleResetShowcase}
        />
      )}
    </div>
  );
}
