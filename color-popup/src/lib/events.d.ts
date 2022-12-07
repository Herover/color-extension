interface UpdateColorEvent {
  id: string;
  hslColor: string;
  hue: number;
  saturation: number;
  value: number;
  alpha: number;
};

interface HighlightEvent {
  /** Id of item */
  id?: string;
  /** Allow deselecting this item  */
  deselect: boolean;
  /** Deselect all items */
  deselectOthers: boolean;
}

interface ColorCircleMoveEvent {
  id: string;
}
interface ColorCircleStopMoveEvent {
  id: string;
}