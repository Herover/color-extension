interface RuleProperty {
  key: string;
  value: string;
  swatchId: string;
};

interface Rule {
  selector: string; // CSS selector
  properties: RuleProperty[];
};
