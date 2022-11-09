interface RuleProperty {
  key: string;
  value: string;
  swatchId: string;
};

export interface Rule {
  selector: string; // CSS selector
  properties: RuleProperty[];
};
