'use client';

import React, { useEffect, useState } from 'react';
import {
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
import { deriveTasksFromEvent } from '@/domain/timeline';
import {
  BudgetOptimizationProposal,
  EventDetails,
  EventPlanState,
  ExpenseItem,
  TimelineTask,
  VendorRecord,
} from '@/domain/types';
import { BudgetManager } from '@/components/budget/BudgetManager';
import { BudgetOptimizerModal } from '@/components/budget/BudgetOptimizerModal';
import { CreateEventModal } from '@/components/creation/CreateEventModal';
import { ExportModal } from '@/components/export/ExportModal';
import { Header } from '@/components/navigation/Header';
import { HeroOverview } from '@/components/overview/HeroOverview';
import { ScenarioSimulator } from '@/components/scenarios/ScenarioSimulator';
import { TimelineManager } from '@/components/timeline/TimelineManager';
import { VendorManager } from '@/components/vendors/VendorManager';

// Default initial showcase celebration
const defaultShowcaseEvent: EventDetails = {
  id: 'ev-emerald-wedding-2027',
  title: 'Emerald Forest Botanical Wedding',
  type: 'wedding',
  theme: 'Botanical Luxury & Champagne Luminary',
  targetDate: '2027-06-18',
  guestCount: 120,
  currency: 'USD',
  totalBudgetMinor: 3500000, // $35,000.00
  contingencyPercentage: 10,  // $3,500.00
  location: 'Highland Botanical Greenhouse',
  notes: 'Cocktail reception on lawn, sit-down dinner in conservatory. Need vegan options.',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

const defaultShowcaseExpenses: ExpenseItem[] = [
  {
    id: 'exp-venue-1',
    categoryId: 'venue',
    name: 'Conservatory & Greenhouse Rental',
    estimatedCostMinor: 1100000,
    actualCostMinor: 1050000,
    paidMinor: 500000,
    status: 'confirmed',
    priority: 'must_have',
    notes: 'Includes indoor backup hall and tables',
  },
  {
    id: 'exp-cat-1',
    categoryId: 'catering',
    name: 'Plated 3-Course Dinner & Open Bar',
    estimatedCostMinor: 1200000,
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'must_have',
    notes: 'Estimated $100/guest for 120 guests',
  },
  {
    id: 'exp-photo-1',
    categoryId: 'photography',
    name: 'Full Day Photography & Drone Coverage',
    estimatedCostMinor: 380000,
    actualCostMinor: 350000,
    paidMinor: 100000,
    status: 'confirmed',
    priority: 'must_have',
    notes: 'Deposit paid, timeline verified',
  },
  {
    id: 'exp-decor-1',
    categoryId: 'decor',
    name: 'Botanical Floral Arches & Centerpieces',
    estimatedCostMinor: 250000,
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'nice_to_have',
    notes: 'White roses, eucalyptus, and hanging wisteria',
  },
  {
    id: 'exp-ent-1',
    categoryId: 'entertainment',
    name: 'Acoustic String Duo & Evening DJ',
    estimatedCostMinor: 200000,
    actualCostMinor: null,
    paidMinor: 0,
    status: 'planned',
    priority: 'nice_to_have',
    notes: 'Ceremony acoustic violin and cocktail jazz',
  },
  {
    id: 'exp-inv-1',
    categoryId: 'invitations',
    name: 'Gold Foil Letterpress Invitations',
    estimatedCostMinor: 60000,
    actualCostMinor: 60000,
    paidMinor: 60000,
    status: 'paid',
    priority: 'optional',
    notes: 'Printed and dispatched with RSVP QR codes',
  },
];

const defaultShowcaseVendors: VendorRecord[] = [
  {
    id: 'v-1',
    name: 'Highland Botanical Estates',
    category: 'venue',
    contactPerson: 'Sarah Jenkins',
    email: 'events@highlandgreenhouse.com',
    phone: '+1 555-234-8891',
    quotedPriceMinor: 1050000,
    status: 'hired',
    notes: 'Contract confirmed, load-in begins at 9:00 AM.',
  },
  {
    id: 'v-2',
    name: 'Artisanal Hearth Catering',
    category: 'catering',
    contactPerson: 'Chef Marcus Vance',
    email: 'marcus@hearthcatering.com',
    phone: '+1 555-891-2309',
    quotedPriceMinor: 1200000,
    status: 'quoted',
    notes: 'Menu tasting scheduled for next month.',
  },
  {
    id: 'v-3',
    name: 'Lumina Wedding Cinematics',
    category: 'photography',
    contactPerson: 'Elena Rostova',
    email: 'elena@luminacinema.com',
    phone: '+1 555-442-9901',
    quotedPriceMinor: 350000,
    status: 'hired',
    notes: 'Standard 8-hour coverage package.',
  },
];

export default function FestiFiApp() {
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'optimizer' | 'scenarios' | 'timeline' | 'vendors'>('overview');
  const [isAiLive, setIsAiLive] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showOptimizerModal, setShowOptimizerModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Welcome to FestiFi AI');

  // Application State
  const [state, setState] = useState<EventPlanState>(() => {
    const saved = loadActiveEventPlanState();
    if (saved) return saved;

    return {
      event: defaultShowcaseEvent,
      expenses: defaultShowcaseExpenses,
      tasks: deriveTasksFromEvent(defaultShowcaseEvent),
      vendors: defaultShowcaseVendors,
      activeProposal: null,
      activeScenarioImpact: null,
      generatedIdeas: {
        concepts: [
          {
            title: 'Botanical Glasshouse Luminary',
            description: 'Lush greenery canopies, trailing ivy arches, warm Edison filament lighting, and intimate acoustic instrumentation creating an ethereal natural atmosphere.',
            estimatedVibe: 'Romantic, Sophisticated & Organic',
            suitability: 'Perfect for estate glasshouses, outdoor conservatories, and botanical gardens.',
          },
          {
            title: 'Modern Minimalist Velvet',
            description: 'Structured calla lily arrangements, geometric brass accents, rich emerald velvet linens, and customized signature gin cocktails.',
            estimatedVibe: 'High-Fashion, Sleek & Contemporary',
            suitability: 'Ideal for modern gallery spaces and urban loft celebrations.',
          },
        ],
        themes: [
          {
            name: 'Emerald Forest & Champagne Gold',
            colorPalette: ['#064E3B', '#D97706', '#F8FAFC', '#1F2937'],
            decorIdeas: ['Eucalyptus table runners', 'Champagne silk accents', 'Gold metallic charger plates'],
            vibe: 'Refined botanical opulence',
          },
          {
            name: 'Celestial Twilight & Ivory',
            colorPalette: ['#1E1B4B', '#9333EA', '#F3F4F6', '#030712'],
            decorIdeas: ['Star-projection canopy', 'Midnight velvet napkins', 'White floral chandeliers'],
            vibe: 'Enchanted evening celebration',
          },
        ],
        menu: [
          { course: 'Hors d’oeuvres', item: 'Truffled Wild Mushroom Tartlets', dietaryNotes: 'Vegetarian & Nut-Free', description: 'Crisp pastry filled with caramelized leeks and thyme-infused wild mushrooms.' },
          { course: 'Main Entrée', item: 'Herb-Roasted Chilean Sea Bass or Filet Mignon', dietaryNotes: 'Gluten-Free & Dairy-Free', description: 'Accompanied by garlic parsnip silk and roasted heirloom carrots.' },
          { course: 'Dessert', item: 'Artisanal Matcha Vanilla Bean Sponge Cake', dietaryNotes: 'Organic & Vegetarian', description: 'Filled with white chocolate mousse and raspberry reduction.' },
        ],
        entertainment: [
          { type: 'Acoustic String Duo', description: 'Classical and modern romantic melodies during guest arrival and ceremony processional.', estimatedCostTier: 'moderate' },
          { type: 'Live 5-Piece Jazz / Dance Band', description: 'Seamless blend of Motown classics, modern pop, and energetic dance anthems.', estimatedCostTier: 'luxury' },
        ],
        recommendedTasks: [
          { title: 'Confirm Floral Mockups with Florist', description: 'Inspect mockup table arrangements for height and lighting', category: 'decor', daysBeforeEvent: 45, priority: 'nice_to_have', milestone: '1.5 Months Before' },
        ],
        recommendedExpenses: [
          { categoryId: 'venue', name: 'Venue Rental Fee', estimatedCostMinor: 1100000, priority: 'must_have' },
          { categoryId: 'catering', name: 'Dinner & Open Bar', estimatedCostMinor: 1200000, priority: 'must_have' },
        ],
        aiAssumptions: [
          'Budget figures reflect verified median regional prices for quality licensed vendors.',
          'Guest count calculations assume 120 adult dinner portions and continuous beverage service.',
        ],
      },
    };
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

  const handleCreateNewEvent = (newEvent: EventDetails) => {
    const derivedTasks = deriveTasksFromEvent(newEvent);

    setState({
      event: newEvent,
      expenses: [
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
      ],
      tasks: derivedTasks,
      vendors: [],
      activeProposal: null,
      activeScenarioImpact: null,
      generatedIdeas: {
        concepts: [
          {
            title: `Bespoke ${newEvent.title} Experience`,
            description: `Tailored celebration concept curated specifically for ${newEvent.guestCount} guests, featuring ${newEvent.theme}.`,
            estimatedVibe: 'Elegant & Engaging',
            suitability: `Customized for ${newEvent.type.replace('_', ' ')} occasions.`,
          },
        ],
        themes: [
          {
            name: `${newEvent.theme} Signature Palette`,
            colorPalette: ['#f59e0b', '#8b5cf6', '#10b981', '#ffffff'],
            decorIdeas: ['Illuminated centerpieces', 'Welcoming entrance arch'],
            vibe: 'Balanced festive warmth',
          },
        ],
        menu: [
          { course: 'Main Culinary Service', item: 'Celebration Platter Selection', dietaryNotes: 'Customized for guest preferences', description: 'Fresh seasonal culinary options.' },
        ],
        entertainment: [
          { type: 'Curated Entertainment Host & Audio', description: 'Professional sound system and playlist control.', estimatedCostTier: 'moderate' },
        ],
        recommendedTasks: [],
        recommendedExpenses: [],
        aiAssumptions: ['Budget allocations calculated based on target guest count and contingency ratio.'],
      },
    });

    setActiveTab('overview');
    setStatusMessage(`Created new celebration plan: "${newEvent.title}"`);
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
            <Users size={16} aria-hidden="true" />
            <span>Vendors & Inquiries ({state.vendors.length})</span>
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
    </div>
  );
}
