interface UpdateColorEvent {
  id: string;
  hslColor: string;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
};

interface HighlightEvent {
  id: string;
}

interface ColorCircleMoveEvent {
  id: string;
}
interface ColorCircleStopMoveEvent {
  id: string;
}