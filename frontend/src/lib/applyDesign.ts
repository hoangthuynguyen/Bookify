import { callGas } from '../hooks/useGasBridge';
import { useAppStore } from '../store/appStore';
import type { HeadingGap, ChapterStartPosition, DropCapStyle } from '../store/appStore';

/**
 * A complete book interior design: document theme + export settings.
 * Shape shared by AI Designer suggestions and built-in book templates.
 */
export interface BookDesign {
  bodyFont: string;
  headingFont: string;
  fontSize: number;
  lineHeight: number;
  colorAccent: string;
  dropCaps: boolean;
  dropCapLines: number;
  dropCapStyle: DropCapStyle;
  sceneBreakSymbol: string;
  headingGap: HeadingGap;
  chapterStartPosition: ChapterStartPosition;
  trimSize: string;
  bindingType: string;
  runningHeader: string;
  largePrint?: boolean;
}

/**
 * Apply a design end-to-end: style the Google Doc via Apps Script and
 * pre-fill every export setting in the shared store.
 */
export async function applyBookDesign(design: BookDesign): Promise<void> {
  // 1. Document-level theme via Apps Script
  await callGas('applyTheme', {
    bodyFont: design.bodyFont,
    headingFont: design.headingFont,
    fontSize: `${design.fontSize}pt`,
    lineHeight: design.lineHeight,
    colorAccent: design.colorAccent,
  });
  await callGas('applySceneBreakStyle', design.sceneBreakSymbol)
    .catch(() => { /* no scene breaks in the doc yet — fine */ });

  // 2. Export/design settings into the shared store
  const s = useAppStore.getState();
  s.setHeadingGap(design.headingGap);
  s.setChapterStartPosition(design.chapterStartPosition);
  s.setDropCaps(design.dropCaps);
  s.setDropCapLines(design.dropCapLines);
  s.setDropCapStyle(design.dropCapStyle);
  s.setSceneBreakSymbol(design.sceneBreakSymbol);
  s.setRunningHeader(design.runningHeader);
  s.setTrimSize(design.trimSize);
  s.setBindingType(design.bindingType as 'paperback' | 'hardcover' | 'spiral');
  s.setLargePrint(!!design.largePrint);
}
