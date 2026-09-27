import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowRight,
  Bath,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Droplets,
  Eye,
  HeartHandshake,
  House,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Volume2,
  Waves,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const STORAGE_KEY = 'aqua-quest-water-memory';

type Screen = 'title' | 'mission' | 'quest' | 'result' | 'real' | 'progress' | 'complete';

interface GameState {
  screen: Screen;
  questIndex: number;
  water: number;
  memory: number;
  answers: number[];
  realQuest: string | null;
  progress: number;
  guardian: boolean;
}

interface Choice {
  label: string;
  detail: string;
  liters: number;
  memory: number;
  correct: boolean;
  consequence: string;
  habit: string;
}

interface Quest {
  number: string;
  kicker: string;
  title: string;
  prompt: string;
  scene: string;
  icon: LucideIcon;
  choices: Choice[];
}

const initialState: GameState = {
  screen: 'title',
  questIndex: 0,
  water: 100,
  memory: 0,
  answers: [],
  realQuest: null,
  progress: 0,
  guardian: false,
};

const quests: Quest[] = [
  {
    number: '01',
    kicker: 'The little choice',
    title: 'Brush with the current',
    prompt: 'The bristles are ready. What does your hand do?',
    scene: 'Morning light catches a full stream. It is easy to leave it running.',
    icon: Droplets,
    choices: [
      {
        label: 'Let it run',
        detail: 'The sound is oddly soothing.',
        liters: 18,
        memory: 4,
        correct: false,
        consequence: 'A bright stream slips away while you brush.',
        habit: 'A running tap can spend 18 litres before you notice.',
      },
      {
        label: 'Turn it off',
        detail: 'The tap can wait for the rinse.',
        liters: 2,
        memory: 11,
        correct: true,
        consequence: 'You keep the stream on standby, not in the drain.',
        habit: 'Pause the tap for the brush. Open it only when you need it.',
      },
      {
        label: 'Use a rinse cup',
        detail: 'One small fill. One clean finish.',
        liters: 1,
        memory: 14,
        correct: true,
        consequence: 'One cup does the work of a whole running tap.',
        habit: 'A rinse cup makes the saving visible: about 1 litre.',
      },
    ],
  },
  {
    number: '02',
    kicker: 'Find the pause',
    title: 'A shower has a rhythm',
    prompt: 'The water is warm. Where do you put the pause?',
    scene: 'Steam softens the mirror. A small timer sits just out of reach.',
    icon: Bath,
    choices: [
      {
        label: 'Stay until the mirror clears',
        detail: 'The warmest minute becomes five.',
        liters: 72,
        memory: 3,
        correct: false,
        consequence: 'The shower keeps singing long after the job is done.',
        habit: 'Long showers spend the most when the minutes feel invisible.',
      },
      {
        label: 'Set a four-minute timer',
        detail: 'Enough time, with a clear edge.',
        liters: 36,
        memory: 12,
        correct: true,
        consequence: 'A soft chime gives the water a finish line.',
        habit: 'A four-minute shower is a repeatable, memorable target.',
      },
      {
        label: 'Pause while soaping',
        detail: 'Flow only when it is doing a job.',
        liters: 24,
        memory: 15,
        correct: true,
        consequence: 'You stop the flow exactly when it is not needed.',
        habit: 'Pause for soap, then restart for the rinse.',
      },
    ],
  },
  {
    number: '03',
    kicker: 'Memory echo',
    title: 'Remember the pause',
    prompt: 'You have seen this moment before. What do you reach for?',
    scene: 'The same warm handle. The same tempting stream. Your memory gets a turn.',
    icon: Timer,
    choices: [
      {
        label: 'The handle',
        detail: 'Let the current decide.',
        liters: 16,
        memory: 2,
        correct: false,
        consequence: 'The old habit arrives before the new one can.',
        habit: 'A cue only becomes a habit when you repeat the better response.',
      },
      {
        label: 'The four-minute timer',
        detail: 'Make the good choice easy to repeat.',
        liters: 28,
        memory: 22,
        correct: true,
        consequence: 'Your second choice is faster. That is the memory working.',
        habit: 'Repeat the same cue: timer first, water second.',
      },
      {
        label: 'Wait and decide later',
        detail: 'The shower decides for you.',
        liters: 46,
        memory: 5,
        correct: false,
        consequence: 'A decision left floating usually lands in the drain.',
        habit: 'Put the saving action within reach before the water starts.',
      },
    ],
  },
  {
    number: '04',
    kicker: 'Spot the signal',
    title: 'The leak that whispers',
    prompt: 'A tap is ticking in the next room. What happens now?',
    scene: 'One drop. Then another. Small sounds can mark a very large loss.',
    icon: Wrench,
    choices: [
      {
        label: 'Ignore the drip',
        detail: 'It is only a little water.',
        liters: 30,
        memory: 3,
        correct: false,
        consequence: 'A quiet leak is still counting, day and night.',
        habit: 'A small drip can become a monthly habit of waste.',
      },
      {
        label: 'Report it today',
        detail: 'Make the signal visible to someone who can fix it.',
        liters: 5,
        memory: 16,
        correct: true,
        consequence: 'The leak enters the light. Fixes start with a report.',
        habit: 'Spot it, report it, follow up. That is community water care.',
      },
      {
        label: 'Put a bowl under it',
        detail: 'Catch the water and call it solved.',
        liters: 12,
        memory: 8,
        correct: false,
        consequence: 'You catch the symptom, but the tap keeps talking.',
        habit: 'Catching a leak helps now; reporting it protects the next day.',
      },
    ],
  },
  {
    number: '05',
    kicker: 'Second life',
    title: 'Give water another job',
    prompt: 'A basin of clean-ish water is left after washing. What is next?',
    scene: 'The water is not drinking water anymore. It is not finished either.',
    icon: RefreshCw,
    choices: [
      {
        label: 'Send it down the drain',
        detail: 'Clear the basin. Start fresh.',
        liters: 20,
        memory: 4,
        correct: false,
        consequence: 'Useful water leaves before its second job begins.',
        habit: 'Not every task needs water straight from the tap.',
      },
      {
        label: 'Save it for plants',
        detail: 'A second job is waiting in the soil.',
        liters: 3,
        memory: 15,
        correct: true,
        consequence: 'The same basin reaches the roots before it reaches the drain.',
        habit: 'Reuse rinse water for plants or cleaning when it is safe to do so.',
      },
      {
        label: 'Add more fresh water',
        detail: 'Dilute the decision away.',
        liters: 10,
        memory: 7,
        correct: false,
        consequence: 'A little extra flow makes the old water easier to forget.',
        habit: 'Pause and ask what a used-but-clean stream can do next.',
      },
    ],
  },
  {
    number: '06',
    kicker: 'When the level drops',
    title: 'Share the last clear refill',
    prompt: 'The neighborhood tank is low. A neighbor arrives with an empty bottle.',
    scene: 'The line is short, the reserve is visible, and everyone is watching the measure.',
    icon: Users,
    choices: [
      {
        label: 'Fill your reserve first',
        detail: 'You found the source. Keep it close.',
        liters: 22,
        memory: 3,
        correct: false,
        consequence: 'A full bottle feels safe. An empty neighbor does not.',
        habit: 'In a shortage, measured sharing keeps more people going.',
      },
      {
        label: 'Share a measured refill',
        detail: 'Enough for both homes to make the next day.',
        liters: 8,
        memory: 20,
        correct: true,
        consequence: 'The reserve travels farther because you made room for another.',
        habit: 'Protect the supply and the people around it, together.',
      },
      {
        label: 'Walk past the line',
        detail: 'Someone else will handle it.',
        liters: 4,
        memory: 6,
        correct: false,
        consequence: 'A community is also a water system. Every gap is felt.',
        habit: 'When water is scarce, showing up is part of the solution.',
      },
    ],
  },
];

const realWorldQuests = [
  {
    id: 'tap-pause',
    title: 'The tap pause',
    detail: 'Turn the tap off while brushing tonight.',
    impact: 'A two-minute pause',
    icon: Droplets,
  },
  {
    id: 'leak-scout',
    title: 'Leak scout',
    detail: 'Find one drip at home and report or fix it.',
    impact: 'One signal noticed',
    icon: Eye,
  },
  {
    id: 'second-life',
    title: 'Second-life water',
    detail: 'Reuse a safe basin of water for plants or cleaning.',
    impact: 'One basin reused',
    icon: RefreshCw,
  },
];

function loadGame(): GameState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState;
    return { ...initialState, ...JSON.parse(saved) } as GameState;
  } catch {
    return initialState;
  }
}

function WaterMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`water-mark relative flex shrink-0 items-center justify-center bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_8px_0_hsl(var(--primary)/.14)] ${small ? 'h-9 w-9' : 'h-14 w-14'}`}
      aria-label="Aqua Quest water mark"
    >
      <Droplets size={small ? 17 : 25} strokeWidth={2.4} />
    </div>
  );
}

function TopBar({ state, onReset }: { state: GameState; onReset: () => void }) {
  const showMeter = state.screen !== 'title' && state.screen !== 'mission';
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <div className="flex items-center gap-3">
        <WaterMark small />
        <div>
          <div className="font-display text-base font-bold tracking-[-.03em] text-[hsl(var(--foreground))]">Aqua Quest</div>
          <div className="font-mono-app text-[9px] uppercase tracking-[.22em] text-[hsl(var(--muted-foreground))]">Water Memory</div>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        {showMeter && (
          <div className="hidden items-center gap-3 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.7)] py-2 pl-3 pr-4 sm:flex">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[hsl(var(--foreground))]">
              <Waves size={14} className="text-[hsl(var(--primary))]" />
              <span data-testid="status-water-held">{state.water} L held</span>
            </div>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
              <div className="h-full rounded-full bg-[hsl(var(--primary))] transition-[width] duration-500" style={{ width: `${state.water}%` }} />
            </div>
          </div>
        )}
        {state.screen !== 'title' && (
          <button
            type="button"
            onClick={onReset}
            data-testid="button-reset-game"
            className="group flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)] px-3 py-2 text-xs font-bold text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--destructive)/.5)] hover:text-[hsl(var(--destructive))]"
          >
            <RotateCcw size={14} className="transition-transform group-hover:-rotate-45" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        )}
      </div>
    </header>
  );
}

function PageFrame({ state, onReset, children }: { state: GameState; onReset: () => void; children: ReactNode }) {
  return (
    <main className="game-shell min-h-[100dvh] text-[hsl(var(--foreground))]">
      <TopBar state={state} onReset={onReset} />
      {children}
      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pb-6 pt-8 text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))] sm:px-8">
        <span>OneAquaHealth · IEEE Global Hackathon 2026</span>
        <span className="hidden items-center gap-1.5 sm:flex"><HeartHandshake size={12} /> One drop at a time</span>
      </footer>
    </main>
  );
}

function PrimaryButton({ children, onClick, testId, disabled = false, kind = 'primary' }: { children: ReactNode; onClick: () => void; testId: string; disabled?: boolean; kind?: 'primary' | 'quiet' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={`group inline-flex items-center justify-center gap-3 rounded-full px-5 py-3.5 text-sm font-extrabold transition-all active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 ${kind === 'primary' ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_5px_0_hsl(var(--primary)/.22)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_hsl(var(--primary)/.22)]' : 'border border-[hsl(var(--border))] bg-[hsl(var(--card)/.55)] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/.55)] hover:bg-[hsl(var(--card))]'}`}
    >
      {children}
      {kind === 'primary' && <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />}
    </button>
  );
}

function TitleScreen({ state, onBegin, onReset }: { state: GameState; onBegin: () => void; onReset: () => void }) {
  const hasSavedRun = state.screen !== 'title';
  return (
    <PageFrame state={state} onReset={onReset}>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-8 pt-9 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-20 lg:pb-20 lg:pt-16">
        <div className="float-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--card)/.6)] px-3 py-1.5 font-mono-app text-[10px] font-medium uppercase tracking-[.18em] text-[hsl(var(--primary))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
            A playable water story
          </div>
          <h1 className="max-w-2xl font-display text-[clamp(3.5rem,8vw,7.3rem)] font-bold leading-[.88] tracking-[-.075em] text-[hsl(var(--foreground))]">
            Make the drop<br /><span className="text-[hsl(var(--primary))]">count.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
            Six quick choices. One water memory. Leave with a habit you can carry past the screen.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <PrimaryButton onClick={onBegin} testId="button-start-quest">
              {hasSavedRun ? 'Continue your current' : 'Start the water run'}
            </PrimaryButton>
            {hasSavedRun && (
              <button type="button" onClick={onReset} data-testid="button-reset-title" className="text-xs font-bold text-[hsl(var(--muted-foreground))] underline decoration-[hsl(var(--primary)/.4)] underline-offset-4 hover:text-[hsl(var(--primary))]">
                Start from the first drop
              </button>
            )}
          </div>
          <div className="mt-12 flex items-center gap-5 border-t border-[hsl(var(--border))] pt-5 text-xs text-[hsl(var(--muted-foreground))]">
            <div className="flex items-center gap-2"><Timer size={15} className="text-[hsl(var(--primary))]" /><span>3–5 min</span></div>
            <div className="h-1 w-1 rounded-full bg-[hsl(var(--border))]" />
            <div className="flex items-center gap-2"><Users size={15} className="text-[hsl(var(--primary))]" /><span>Solo, for the community</span></div>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[480px] lg:justify-self-end">
          <div className="absolute -right-3 top-7 h-20 w-20 rounded-full bg-[hsl(var(--accent)/.65)] blur-2xl" />
          <div className="absolute -bottom-6 left-4 h-32 w-32 rounded-full bg-[hsl(var(--primary)/.2)] blur-3xl" />
          <div className="relative overflow-hidden rounded-[2.25rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.72)] p-5 shadow-[0_22px_70px_hsl(198_40%_30%/.12)] sm:p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono-app text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">Your water memory</span>
              <span className="rounded-full bg-[hsl(var(--accent))] px-2 py-1 font-mono-app text-[10px] font-bold text-[hsl(var(--accent-foreground))]">LIVE</span>
            </div>
            <div className="relative mx-auto mt-10 flex aspect-square max-w-[280px] items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[hsl(var(--primary)/.12)]" />
              <div className="absolute inset-[12%] rounded-full border border-dashed border-[hsl(var(--primary)/.24)]" />
              <div className="pulse-water relative flex h-44 w-44 items-center justify-center rounded-[44%_56%_60%_40%/44%_40%_60%_56%] bg-[hsl(var(--primary))] shadow-[inset_-18px_-16px_0_hsl(198_40%_22%/.12),0_18px_0_hsl(var(--primary)/.2)] sm:h-52 sm:w-52">
                <Waves size={78} strokeWidth={1.4} className="text-[hsl(var(--primary-foreground)/.82)]" />
                <div className="absolute bottom-8 right-8 h-3 w-3 rounded-full bg-[hsl(var(--accent))]" />
              </div>
              <div className="absolute left-0 top-11 rotate-[-8deg] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.82)] px-3 py-2 shadow-sm">
                <div className="font-mono-app text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">remember</div>
                <div className="mt-0.5 text-xs font-extrabold">the pause</div>
              </div>
              <div className="absolute bottom-10 right-0 rotate-[7deg] rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background)/.82)] px-3 py-2 shadow-sm">
                <div className="font-mono-app text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">carry it</div>
                <div className="mt-0.5 text-xs font-extrabold">home</div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-2 border-t border-[hsl(var(--border))] pt-5 text-center">
              <div><div className="font-display text-xl font-bold">06</div><div className="mt-1 font-mono-app text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">quests</div></div>
              <div><div className="font-display text-xl font-bold">01</div><div className="mt-1 font-mono-app text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">real action</div></div>
              <div><div className="font-display text-xl font-bold">∞</div><div className="mt-1 font-mono-app text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">ripple</div></div>
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function MissionScreen({ state, onStart, onReset }: { state: GameState; onStart: () => void; onReset: () => void }) {
  return (
    <PageFrame state={state} onReset={onReset}>
      <section className="mx-auto w-full max-w-4xl px-5 pb-12 pt-10 sm:px-8 sm:pt-16">
        <div className="quest-enter">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="font-mono-app text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">Mission briefing / 00</div>
            <div className="flex items-center gap-2 text-xs font-bold text-[hsl(var(--muted-foreground))]"><span>6 choices ahead</span><span className="h-1 w-1 rounded-full bg-[hsl(var(--accent))]" /><span>Nothing to memorize but the feeling</span></div>
          </div>
          <div className="mt-10 grid gap-10 md:grid-cols-[.8fr_1.2fr] md:items-end">
            <div>
              <div className="relative mb-8 flex h-36 w-36 items-center justify-center rounded-[45%_55%_50%_50%/52%_44%_56%_48%] bg-[hsl(var(--accent))] shadow-[0_12px_0_hsl(var(--accent)/.25)]">
                <CircleHelp size={54} strokeWidth={1.5} />
                <div className="absolute -right-3 -top-3 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2.5"><Sparkles size={18} className="text-[hsl(var(--primary))]" /></div>
              </div>
              <h1 className="font-display text-5xl font-bold leading-[.95] tracking-[-.06em] sm:text-7xl">The water<br /><span className="text-[hsl(var(--primary))]">remembers.</span></h1>
            </div>
            <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.75)] p-6 sm:p-8">
              <p className="font-mono-app text-[10px] uppercase tracking-[.2em] text-[hsl(var(--muted-foreground))]">How this works</p>
              <p className="mt-4 text-lg font-semibold leading-8">Each choice changes the water left in the story. The choices you repeat become a memory you can take with you.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                {quests.map((quest) => <div key={quest.number} className="flex h-9 w-9 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background)/.6)] font-mono-app text-[10px] font-bold text-[hsl(var(--muted-foreground))]">{quest.number}</div>)}
              </div>
              <div className="mt-8 flex justify-end"><PrimaryButton onClick={onStart} testId="button-begin-mission">Enter the first moment</PrimaryButton></div>
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function QuestScreen({ state, onChoice, selectedChoice, onContinue, onReset }: { state: GameState; onChoice: (index: number) => void; selectedChoice: number | null; onContinue: () => void; onReset: () => void }) {
  const quest = quests[state.questIndex];
  const selected = selectedChoice === null ? null : quest.choices[selectedChoice];
  const Icon = quest.icon;
  return (
    <PageFrame state={state} onReset={onReset}>
      <section className="mx-auto w-full max-w-6xl px-5 pb-10 pt-6 sm:px-8 sm:pt-10">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <div className="font-mono-app text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">Quest {quest.number} / 06 · {quest.kicker}</div>
            <div className="mt-3 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="font-bold text-[hsl(var(--foreground))]">Water held</span>
              <span data-testid="text-quest-water">{state.water} L</span>
              <span className="h-1 w-1 rounded-full bg-[hsl(var(--border))]" />
              <span>Memory {state.memory}%</span>
            </div>
          </div>
          <div className="hidden gap-1.5 sm:flex" aria-label={`Quest ${state.questIndex + 1} of 6`}>
            {quests.map((item, index) => <div key={item.number} className={`h-1.5 w-7 rounded-full transition-colors sm:w-10 ${index < state.questIndex ? 'bg-[hsl(var(--primary))]' : index === state.questIndex ? 'bg-[hsl(var(--accent))]' : 'bg-[hsl(var(--border))]'}`} />)}
          </div>
        </div>
        <div className="quest-enter grid gap-6 lg:grid-cols-[.78fr_1.22fr]">
          <div className="relative min-h-[315px] overflow-hidden rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--primary))] p-7 text-[hsl(var(--primary-foreground))] sm:min-h-[440px] sm:p-10">
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-[hsl(var(--primary-foreground)/.18)]" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full border border-[hsl(var(--primary-foreground)/.12)]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="rounded-full border border-[hsl(var(--primary-foreground)/.3)] px-3 py-1.5 font-mono-app text-[10px] uppercase tracking-[.18em]">A moment to notice</div>
                <Icon size={22} strokeWidth={1.8} />
              </div>
              <div className="my-12 sm:my-16">
                <div className="mb-5 h-1 w-12 bg-[hsl(var(--accent))]" />
                <p className="max-w-sm font-display text-3xl font-bold leading-[1.02] tracking-[-.04em] sm:text-5xl">{quest.scene}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[hsl(var(--primary-foreground)/.7)]"><Volume2 size={14} /><span>Listen for the consequence.</span></div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.7)] p-6 sm:p-10">
            <div className="max-w-xl">
              <h1 className="font-display text-4xl font-bold leading-[.98] tracking-[-.06em] sm:text-6xl">{quest.title}</h1>
              <p className="mt-5 text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">{quest.prompt}</p>
            </div>
            <div className="mt-8 grid gap-3">
              {quest.choices.map((choice, index) => {
                const isSelected = selectedChoice === index;
                return (
                  <button
                    type="button"
                    key={choice.label}
                    disabled={selectedChoice !== null}
                    onClick={() => onChoice(index)}
                    data-testid={`button-choice-${state.questIndex}-${index}`}
                    className={`choice-card flex w-full items-center gap-4 rounded-2xl border bg-[hsl(var(--background)/.55)] p-4 text-left ${isSelected ? (choice.correct ? 'is-correct' : 'is-wrong') : 'border-[hsl(var(--border))]'} ${selectedChoice !== null && !isSelected ? 'opacity-45' : ''}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono-app text-xs font-bold ${isSelected ? (choice.correct ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]') : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>{String.fromCharCode(65 + index)}</span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold">{choice.label}</span><span className="mt-1 block text-xs leading-5 text-[hsl(var(--muted-foreground))]">{choice.detail}</span></span>
                    <span className="shrink-0 text-right"><span className="block font-mono-app text-[10px] font-bold text-[hsl(var(--primary))]">−{choice.liters} L</span><span className="mt-1 block text-[9px] uppercase tracking-wider text-[hsl(var(--muted-foreground))]">impact</span></span>
                  </button>
                );
              })}
            </div>
            {selected && (
              <div className={`float-in mt-5 rounded-2xl border p-5 ${selected.correct ? 'border-[hsl(var(--primary)/.35)] bg-[hsl(var(--primary)/.08)]' : 'border-[hsl(var(--destructive)/.35)] bg-[hsl(var(--destructive)/.07)]'}`} data-testid="status-consequence">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1.5 ${selected.correct ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]'}`}>{selected.correct ? <Check size={14} strokeWidth={3} /> : <Droplets size={14} />}</div>
                  <div className="flex-1">
                    <div className="text-sm font-extrabold">{selected.correct ? 'Memory locked in.' : 'The water felt that one.'}</div>
                    <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{selected.consequence}</p>
                    <div className="mt-3 border-t border-current/10 pt-3 text-xs font-semibold leading-5">Water memory: {selected.habit}</div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end"><PrimaryButton onClick={onContinue} testId="button-continue-quest">{state.questIndex === quests.length - 1 ? 'See your water memory' : 'Carry the memory forward'}</PrimaryButton></div>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function ResultScreen({ state, onContinue, onReset }: { state: GameState; onContinue: () => void; onReset: () => void }) {
  const saved = 100 - state.water;
  const label = state.memory >= 75 ? 'A strong ripple' : state.memory >= 50 ? 'A ripple is forming' : 'A ripple to practice';
  return (
    <PageFrame state={state} onReset={onReset}>
      <section className="mx-auto w-full max-w-5xl px-5 pb-12 pt-10 sm:px-8 sm:pt-16">
        <div className="quest-enter grid gap-10 md:grid-cols-[.85fr_1.15fr] md:items-center">
          <div>
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[42%_58%_55%_45%/48%_45%_55%_52%] bg-[hsl(var(--accent))] shadow-[0_10px_0_hsl(var(--accent)/.22)]"><Trophy size={42} strokeWidth={1.6} /></div>
            <div className="font-mono-app text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">Quest complete / 06 of 06</div>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[.9] tracking-[-.07em] sm:text-7xl">You made<br /><span className="text-[hsl(var(--primary))]">an impact.</span></h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-[hsl(var(--muted-foreground))]">The choices are over. The memory does not have to be.</p>
          </div>
          <div>
            <div className="rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.75)] p-6 sm:p-9">
              <div className="flex items-start justify-between gap-4 border-b border-[hsl(var(--border))] pb-6">
                <div><div className="font-mono-app text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Your run says</div><div className="mt-2 text-xl font-extrabold">{label}</div></div>
                <div className="rounded-full bg-[hsl(var(--primary)/.12)] px-3 py-1.5 font-mono-app text-[10px] font-bold text-[hsl(var(--primary))]">SAVED</div>
              </div>
              <div className="grid grid-cols-2 gap-6 py-7">
                <div><div className="font-display text-5xl font-bold tracking-[-.07em] text-[hsl(var(--primary))]" data-testid="text-water-result">{state.water} L</div><div className="mt-2 text-xs font-bold text-[hsl(var(--muted-foreground))]">water held in the story</div></div>
                <div><div className="font-display text-5xl font-bold tracking-[-.07em] text-[hsl(var(--accent-foreground))]" data-testid="text-memory-result">{state.memory}%</div><div className="mt-2 text-xs font-bold text-[hsl(var(--muted-foreground))]">memory strength</div></div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[hsl(var(--secondary))]"><div className="h-full rounded-full bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--accent)))] transition-[width] duration-700" style={{ width: `${state.memory}%` }} /></div>
              <p className="mt-6 text-sm leading-6 text-[hsl(var(--muted-foreground))]">You used <strong className="text-[hsl(var(--foreground))]">{saved} litres</strong> across the run. Now choose one small action for the real world.</p>
              <div className="mt-7 flex justify-end"><PrimaryButton onClick={onContinue} testId="button-choose-real-quest">Choose my real-world quest</PrimaryButton></div>
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function RealQuestScreen({ state, selectedQuest, onSelect, onContinue, onReset }: { state: GameState; selectedQuest: string | null; onSelect: (id: string) => void; onContinue: () => void; onReset: () => void }) {
  return (
    <PageFrame state={state} onReset={onReset}>
      <section className="mx-auto w-full max-w-5xl px-5 pb-12 pt-8 sm:px-8 sm:pt-14">
        <div className="quest-enter">
          <div className="font-mono-app text-[10px] uppercase tracking-[.2em] text-[hsl(var(--primary))]">The last quest is yours / 07</div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div><h1 className="font-display text-5xl font-bold leading-[.9] tracking-[-.07em] sm:text-7xl">Carry one<br /><span className="text-[hsl(var(--primary))]">drop home.</span></h1><p className="mt-5 max-w-md text-base leading-7 text-[hsl(var(--muted-foreground))]">Pick one action you can honestly do today. Small is not the same as meaningless.</p></div>
            <div className="flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/.6)] px-3 py-2 text-xs font-bold"><ClipboardCheck size={15} className="text-[hsl(var(--primary))]" /> Choose one mission</div>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {realWorldQuests.map((quest) => {
              const Icon = quest.icon;
              const isSelected = selectedQuest === quest.id;
              return (
                <button type="button" key={quest.id} onClick={() => onSelect(quest.id)} data-testid={`button-real-quest-${quest.id}`} className={`choice-card relative min-h-[210px] rounded-[1.6rem] border p-5 text-left ${isSelected ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)] shadow-[0_8px_0_hsl(var(--primary)/.12)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card)/.65)]'}`}>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isSelected ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]'}`}><Icon size={21} /></div>
                  <div className="mt-10 text-lg font-extrabold">{quest.title}</div>
                  <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">{quest.detail}</p>
                  <div className="absolute bottom-5 left-5 font-mono-app text-[9px] uppercase tracking-[.14em] text-[hsl(var(--primary))]">{quest.impact}</div>
                  {isSelected && <div className="absolute right-5 top-5 rounded-full bg-[hsl(var(--primary))] p-1 text-[hsl(var(--primary-foreground))]"><Check size={13} strokeWidth={3} /></div>}
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--background)/.4)] p-4 pl-5">
            <p className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">No proof needed. Your word is enough to start the ripple.</p>
            <PrimaryButton onClick={onContinue} disabled={!selectedQuest} testId="button-commit-real-quest">Commit to this quest</PrimaryButton>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function ProgressScreen({ state, quest, progress, onProgress, onComplete, onReset }: { state: GameState; quest: (typeof realWorldQuests)[number]; progress: number; onProgress: (value: number) => void; onComplete: () => void; onReset: () => void }) {
  const Icon = quest.icon;
  const steps = [
    { title: 'Notice', detail: 'See the moment before it passes.', icon: Eye },
    { title: 'Do', detail: 'Take the small action you chose.', icon: HandIcon },
    { title: 'Remember', detail: 'Name the habit so it can return.', icon: HeartHandshake },
  ];
  return (
    <PageFrame state={state} onReset={onReset}>
      <section className="mx-auto w-full max-w-3xl px-5 pb-12 pt-10 sm:px-8 sm:pt-16">
        <div className="quest-enter">
          <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Icon size={23} /></div><div><div className="font-mono-app text-[10px] uppercase tracking-[.18em] text-[hsl(var(--primary))]">Manual progress</div><div className="text-sm font-extrabold">{quest.title}</div></div></div>
          <h1 className="mt-10 max-w-xl font-display text-5xl font-bold leading-[.92] tracking-[-.07em] sm:text-7xl">Make it<br /><span className="text-[hsl(var(--primary))]">real.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[hsl(var(--muted-foreground))]">Tap each step when it is true. This is a promise you keep for yourself, not a score you report.</p>
          <div className="mt-10 rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--card)/.75)] p-5 sm:p-8">
            <div className="mb-8 flex items-center justify-between"><div className="font-mono-app text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">Your progress</div><div className="font-mono-app text-sm font-bold text-[hsl(var(--primary))]" data-testid="text-real-progress">{progress}/3</div></div>
            <div className="mb-8 h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]"><div className="h-full rounded-full bg-[hsl(var(--primary))] transition-[width] duration-500" style={{ width: `${(progress / 3) * 100}%` }} /></div>
            <div className="grid gap-3">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const done = index < progress;
                return <button type="button" key={step.title} onClick={() => onProgress(index < progress ? index : index + 1)} data-testid={`button-progress-step-${index}`} className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${done ? 'border-[hsl(var(--primary)/.45)] bg-[hsl(var(--primary)/.08)]' : 'border-[hsl(var(--border))] bg-[hsl(var(--background)/.4)] hover:border-[hsl(var(--primary)/.5)]'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${done ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : 'bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]'}`}>{done ? <Check size={18} strokeWidth={3} /> : <StepIcon size={18} />}</span><span className="flex-1"><span className="block text-sm font-extrabold">{step.title}</span><span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">{step.detail}</span></span><ChevronRight size={17} className={`text-[hsl(var(--muted-foreground))] transition-transform ${done ? 'rotate-90 text-[hsl(var(--primary))]' : ''}`} /></button>;
              })}
            </div>
            <div className="mt-8 flex justify-end"><PrimaryButton onClick={onComplete} disabled={progress < 3} testId="button-complete-guardian">Become a Real Water Guardian</PrimaryButton></div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}

function HandIcon({ size = 18 }: { size?: number }) {
  return <span className="inline-flex" aria-hidden="true"><CheckCircle2 size={size} /></span>;
}

function CompleteScreen({ state, quest, onRestart }: { state: GameState; quest: (typeof realWorldQuests)[number]; onRestart: () => void }) {
  const Icon = quest.icon;
  return (
    <PageFrame state={state} onReset={onRestart}>
      <section className="mx-auto w-full max-w-3xl px-5 pb-16 pt-12 text-center sm:px-8 sm:pt-20">
        <div className="celebrate">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-[43%_57%_55%_45%/48%_43%_57%_52%] bg-[hsl(var(--accent))] shadow-[0_12px_0_hsl(var(--accent)/.22)]">
            <ShieldIcon />
            <div className="absolute -right-4 top-1 rounded-full bg-[hsl(var(--primary))] p-2 text-[hsl(var(--primary-foreground))]"><Sparkles size={17} /></div>
          </div>
          <div className="mt-9 font-mono-app text-[10px] uppercase tracking-[.22em] text-[hsl(var(--primary))]">Guardian status / active</div>
          <h1 className="mx-auto mt-4 max-w-2xl font-display text-6xl font-bold leading-[.87] tracking-[-.08em] sm:text-8xl">The ripple<br /><span className="text-[hsl(var(--primary))]">leaves here.</span></h1>
          <p className="mx-auto mt-7 max-w-md text-base leading-7 text-[hsl(var(--muted-foreground))]">You chose <strong className="text-[hsl(var(--foreground))]">{quest.title.toLowerCase()}</strong>. The next time the moment appears, your memory has somewhere to go.</p>
          <div className="mx-auto mt-9 flex max-w-md items-center gap-4 rounded-2xl border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.08)] p-4 text-left"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"><Icon size={19} /></div><div><div className="text-sm font-extrabold">Your real-world quest</div><div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{quest.detail}</div></div><Check size={17} className="ml-auto shrink-0 text-[hsl(var(--primary))]" /></div>
          <div className="mt-9 flex flex-wrap justify-center gap-3"><PrimaryButton onClick={onRestart} testId="button-play-again">Play again</PrimaryButton><button type="button" onClick={() => window.print()} data-testid="button-save-guardian" className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] px-5 py-3.5 text-sm font-extrabold text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--primary)/.5)]"><ClipboardCheck size={16} /> Keep the promise</button></div>
        </div>
      </section>
    </PageFrame>
  );
}

function ShieldIcon() {
  return <div className="flex h-16 w-16 items-center justify-center rounded-[45%] border-[3px] border-[hsl(var(--foreground))]"><Waves size={30} strokeWidth={1.7} /></div>;
}

function Game() {
  const [game, setGame] = useState<GameState>(loadGame);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(() => game.screen === 'quest' && game.answers.length > game.questIndex ? game.answers[game.answers.length - 1] : null);
  const [selectedRealQuest, setSelectedRealQuest] = useState<string | null>(game.realQuest);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  const reset = () => {
    if (window.confirm('Restart your water memory from the first drop?')) {
      setGame(initialState);
      setSelectedChoice(null);
      setSelectedRealQuest(null);
    }
  };

  const begin = () => {
    if (game.screen === 'title') setGame((current) => ({ ...current, screen: 'mission' }));
    else if (game.screen === 'mission') setGame((current) => ({ ...current, screen: 'quest' }));
    else if (game.screen === 'quest') setGame((current) => current);
  };

  const choose = (index: number) => {
    if (selectedChoice !== null) return;
    const choice = quests[game.questIndex].choices[index];
    setSelectedChoice(index);
    setGame((current) => ({
      ...current,
      water: Math.max(0, current.water - choice.liters),
      memory: Math.min(100, current.memory + choice.memory),
      answers: [...current.answers, index],
    }));
  };

  const continueQuest = () => {
    if (game.questIndex >= quests.length - 1) setGame((current) => ({ ...current, screen: 'result' }));
    else {
      setGame((current) => ({ ...current, questIndex: current.questIndex + 1 }));
      setSelectedChoice(null);
    }
  };

  const resultQuest = useMemo(() => realWorldQuests.find((quest) => quest.id === (game.realQuest ?? selectedRealQuest)) ?? realWorldQuests[0], [game.realQuest, selectedRealQuest]);

  const selectRealQuest = (id: string) => {
    setSelectedRealQuest(id);
    setGame((current) => ({ ...current, realQuest: id }));
  };

  const commitQuest = () => {
    if (!selectedRealQuest) return;
    setGame((current) => ({ ...current, realQuest: selectedRealQuest, screen: 'progress' }));
  };

  const complete = () => setGame((current) => ({ ...current, guardian: true, screen: 'complete' }));
  const updateProgress = (value: number) => setGame((current) => ({ ...current, progress: Math.max(0, Math.min(3, value)) }));

  if (game.screen === 'title') return <TitleScreen state={game} onBegin={begin} onReset={reset} />;
  if (game.screen === 'mission') return <MissionScreen state={game} onStart={() => setGame((current) => ({ ...current, screen: 'quest' }))} onReset={reset} />;
  if (game.screen === 'quest') return <QuestScreen state={game} onChoice={choose} selectedChoice={selectedChoice} onContinue={continueQuest} onReset={reset} />;
  if (game.screen === 'result') return <ResultScreen state={game} onContinue={() => setGame((current) => ({ ...current, screen: 'real' }))} onReset={reset} />;
  if (game.screen === 'real') return <RealQuestScreen state={game} selectedQuest={selectedRealQuest} onSelect={selectRealQuest} onContinue={commitQuest} onReset={reset} />;
  if (game.screen === 'progress') return <ProgressScreen state={game} quest={resultQuest} progress={game.progress} onProgress={updateProgress} onComplete={complete} onReset={reset} />;
  return <CompleteScreen state={game} quest={resultQuest} onRestart={reset} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Game} />
      <Route component={NotFound} />
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <RoutedErrorBoundary><Router /></RoutedErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;