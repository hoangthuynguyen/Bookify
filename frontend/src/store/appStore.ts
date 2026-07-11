import { create } from 'zustand';
import type { BindingType, MeasurementUnit } from '../data/printSizes';

type Tab = 'export' | 'formatting' | 'themes' | 'tools' | 'structure' | 'previewer' | 'versions' | 'boxset' | 'bible' | 'automation' | 'design' | 'publishing';

export type HeadingGap = 'compact' | 'normal' | 'spacious' | 'dramatic';
export type ChapterStartPosition = 'top' | 'middle' | 'bottom';
export type DropCapStyle = 'classic' | 'accent' | 'ornate';

interface AppState {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;

  // Export state
  exportFormats: string[];
  toggleExportFormat: (format: string) => void;
  trimSize: string;
  setTrimSize: (size: string) => void;
  bindingType: BindingType;
  setBindingType: (bt: BindingType) => void;
  genre: string;
  setGenre: (g: string) => void;
  measurementUnit: MeasurementUnit;
  setMeasurementUnit: (u: MeasurementUnit) => void;
  isExporting: boolean;
  setIsExporting: (v: boolean) => void;
  lastExportUrl: string | null;
  setLastExportUrl: (url: string | null) => void;

  // Design settings (shared across panels, included in every export payload)
  headingGap: HeadingGap;
  setHeadingGap: (g: HeadingGap) => void;
  chapterStartPosition: ChapterStartPosition;
  setChapterStartPosition: (p: ChapterStartPosition) => void;
  largePrint: boolean;
  setLargePrint: (v: boolean) => void;
  dropCapLines: number;
  setDropCapLines: (n: number) => void;
  dropCapStyle: DropCapStyle;
  setDropCapStyle: (s: DropCapStyle) => void;
  dropCaps: boolean;
  setDropCaps: (v: boolean) => void;
  sceneBreakSymbol: string;
  setSceneBreakSymbol: (s: string) => void;
  runningHeader: string;
  setRunningHeader: (h: string) => void;
  bookLanguage: string;
  setBookLanguage: (l: string) => void;
  tocTitle: string;
  setTocTitle: (t: string) => void;

  // Theme state
  selectedThemeId: string | null;
  setSelectedThemeId: (id: string | null) => void;

  // Writing tools
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;

  // Global
  error: string | null;
  setError: (err: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'export',
  setActiveTab: (tab) => set({ activeTab: tab }),

  exportFormats: ['epub'],
  toggleExportFormat: (format) => set((state) => ({
    exportFormats: state.exportFormats.includes(format)
      ? state.exportFormats.filter((f) => f !== format)
      : [...state.exportFormats, format],
  })),
  trimSize: '6x9',
  setTrimSize: (size) => set({ trimSize: size }),
  bindingType: 'paperback',
  setBindingType: (bt) => set({ bindingType: bt }),
  genre: '',
  setGenre: (g) => set({ genre: g }),
  measurementUnit: 'in',
  setMeasurementUnit: (u) => set({ measurementUnit: u }),
  isExporting: false,
  setIsExporting: (v) => set({ isExporting: v }),
  lastExportUrl: null,
  setLastExportUrl: (url) => set({ lastExportUrl: url }),

  headingGap: 'normal',
  setHeadingGap: (g) => set({ headingGap: g }),
  chapterStartPosition: 'top',
  setChapterStartPosition: (p) => set({ chapterStartPosition: p }),
  largePrint: false,
  setLargePrint: (v) => set({ largePrint: v }),
  dropCapLines: 3,
  setDropCapLines: (n) => set({ dropCapLines: n }),
  dropCapStyle: 'classic',
  setDropCapStyle: (s) => set({ dropCapStyle: s }),
  dropCaps: false,
  setDropCaps: (v) => set({ dropCaps: v }),
  sceneBreakSymbol: '* * *',
  setSceneBreakSymbol: (s) => set({ sceneBreakSymbol: s }),
  runningHeader: 'none',
  setRunningHeader: (h) => set({ runningHeader: h }),
  bookLanguage: '',
  setBookLanguage: (l) => set({ bookLanguage: l }),
  tocTitle: '',
  setTocTitle: (t) => set({ tocTitle: t }),

  selectedThemeId: null,
  setSelectedThemeId: (id) => set({ selectedThemeId: id }),

  dailyGoal: 1000,
  setDailyGoal: (goal) => set({ dailyGoal: goal }),

  error: null,
  setError: (err) => set({ error: err }),
}));
