export interface PetProjectData {
  id: string;
  order?: number;
  buttonLabel?: string;
  shortName?: string;
  title: string;
  pitch?: string;
  embedUrl?: string;
  externalUrl?: string;
  isActive?: boolean;
}

export const DEFAULT_PET_PROJECTS: PetProjectData[] = [
  {
    id: "pet-1",
    order: 1,
    buttonLabel: "1",
    shortName: "LED LAB",
    title: "LED Matrix Lab",
    pitch:
      "Interactive kinetic LED portrait experiment with cubist module permutation and real-time pixel scrubbing.",
    embedUrl: "/ledtest",
    externalUrl: "/ledtest",
    isActive: true,
  },
  {
    id: "pet-2",
    order: 2,
    buttonLabel: "2",
    shortName: "SYNTH UI",
    title: "Tactile Synth Interface",
    pitch:
      "Hardware-inspired web audio experiment exploring skeuomorphic controls and micro-interactions.",
    embedUrl: "",
    isActive: true,
  },
  {
    id: "pet-3",
    order: 3,
    buttonLabel: "3",
    shortName: "GRID OS",
    title: "Grid OS Playground",
    pitch:
      "Experimental modular workspace layout built around tactile switches and zero-latency keyboard flow.",
    embedUrl: "",
    isActive: true,
  },
];
