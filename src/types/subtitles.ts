export interface SubtitleCue {
  id: number;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  cues: SubtitleCue[];
}

export interface AudioLanguageTrack {
  id: string;
  label: string;
  language: string;
  isExternal: boolean;
  src?: string;
  audioElement?: HTMLAudioElement;
}
