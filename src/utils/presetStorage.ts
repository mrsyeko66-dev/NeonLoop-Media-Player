import { LoopPreset, MediaSegment } from '../types/player';

const PRESETS_STORAGE_KEY = 'neonloop_presets_v1';

// Default initial demo segments (e.g. 0-5s x 4, 5-10s x 4, 10-15s x 4)
export const DEFAULT_DEMO_SEGMENTS: MediaSegment[] = [
  {
    id: 'seg-1',
    name: 'Segment 1 (0s - 5s)',
    startTime: 0,
    endTime: 5,
    repeatCount: 4,
    pauseDelay: 0.3,
    color: '#00f0ff',
  },
  {
    id: 'seg-2',
    name: 'Segment 2 (5s - 10s)',
    startTime: 5,
    endTime: 10,
    repeatCount: 4,
    pauseDelay: 0.3,
    color: '#3b82f6',
  },
  {
    id: 'seg-3',
    name: 'Segment 3 (10s - 15s)',
    startTime: 10,
    endTime: 15,
    repeatCount: 4,
    pauseDelay: 0.3,
    color: '#a855f7',
  },
];

export function getStoredPresets(): LoopPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load presets from storage', err);
    return [];
  }
}

export function savePreset(preset: Omit<LoopPreset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): LoopPreset {
  const existing = getStoredPresets();
  const now = Date.now();
  
  if (preset.id) {
    const updated = existing.map((p) =>
      p.id === preset.id ? { ...p, ...preset, updatedAt: now } : p
    );
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    return updated.find((p) => p.id === preset.id)!;
  } else {
    const newPreset: LoopPreset = {
      ...preset,
      id: 'preset_' + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newPreset, ...existing];
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
    return newPreset;
  }
}

export function deletePreset(presetId: string): void {
  const existing = getStoredPresets();
  const updated = existing.filter((p) => p.id !== presetId);
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated));
}

export function exportPresetsToJson(): string {
  const presets = getStoredPresets();
  return JSON.stringify(presets, null, 2);
}

export function importPresetsFromJson(jsonContent: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'JSON content must be an array of presets' };
    }
    const current = getStoredPresets();
    const map = new Map(current.map((p) => [p.id, p]));
    let imported = 0;
    for (const item of parsed) {
      if (item && item.title && Array.isArray(item.segments)) {
        const id = item.id || 'preset_' + Math.random().toString(36).substring(2, 9);
        map.set(id, { ...item, id });
        imported++;
      }
    }
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(Array.from(map.values())));
    return { success: true, count: imported };
  } catch (err: unknown) {
    return { success: false, count: 0, error: err instanceof Error ? err.message : 'Invalid JSON file' };
  }
}
