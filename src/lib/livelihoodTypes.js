const LIVELIHOOD_TYPES = {

  // ─── Farm (Cultivation-based) ───
  sugarcane_cultivation: {
    category: "FARM",
    label: "Sugarcane Cultivation",
    icon: "agriculture",
    description: "Crop cycles, fertilizer tracking, and harvest yields for sugarcane farmers.",
    fields: [
      { name: "hectaresAllotted", label: "Land Allotted (Ha)", type: "number", step: "0.1", unit: "Ha" },
      { name: "soilType", label: "Soil Type", type: "select", options: ["Clay Loam", "Sandy Loam", "Alluvial", "Black Cotton", "Red Soil"] },
      { name: "waterSource", label: "Water Source", type: "select", options: ["Drip Irrigation", "Canal Linkage", "Rainfed", "Tube Well", "Borewell", "Sprinkler"] },
      { name: "cropStage", label: "Crop Stage", type: "select", options: ["Preparation", "Planting", "Growing", "Harvesting", "Post-Harvest"] },
      { name: "fertilizersDistributed", label: "Fertilizers Distributed", type: "text" },
      { name: "estimatedYieldTons", label: "Est. Yield (Tons)", type: "number", step: "0.1", unit: "Tons" },
      { name: "actualYieldTons", label: "Actual Yield (Tons)", type: "number", step: "0.1", unit: "Tons" },
      { name: "estimatedRevenue", label: "Est. Revenue (INR)", type: "number", step: "0.01", unit: "₹" },
      { name: "actualRevenue", label: "Actual Revenue (INR)", type: "number", step: "0.01", unit: "₹" },
    ],
    eventTypes: ["Planting", "Fertilization", "Irrigation", "Pest Control", "Growth Monitoring", "Harvest"],
    tableColumns: [
      { key: "hectaresAllotted", label: "Land (Ha)", type: "number" },
      { key: "cropStage", label: "Crop Stage", type: "badge" },
      { key: "soilType", label: "Soil Type", type: "text" },
      { key: "estimatedYieldTons", label: "Est. Yield", type: "number", unit: "Tons" },
      { key: "estimatedRevenue", label: "Est. Revenue", type: "currency" },
    ],
    kpiCards: [
      { label: "Total Land Allotted", key: "hectaresAllotted", unit: "Ha", aggregate: "sum", icon: "terrain" },
      { label: "Est. Yield Forecast", key: "estimatedYieldTons", unit: "Tons", aggregate: "sum", icon: "grain" },
      { label: "Est. Revenue", key: "estimatedRevenue", aggregate: "sum", format: "currency", icon: "payments" },
    ],
    programTargetUnit: "Ha",
  },

  maize_cultivation: {
    category: "FARM",
    label: "Maize Cultivation",
    icon: "grain",
    description: "Track maize planting cycles, yields, and revenue.",
    fields: [
      { name: "hectaresAllotted", label: "Land Allotted (Ha)", type: "number", step: "0.1", unit: "Ha" },
      { name: "seedVariety", label: "Seed Variety", type: "text" },
      { name: "soilType", label: "Soil Type", type: "select", options: ["Clay Loam", "Sandy Loam", "Alluvial", "Red Soil"] },
      { name: "waterSource", label: "Water Source", type: "select", options: ["Drip Irrigation", "Canal Linkage", "Rainfed", "Tube Well"] },
      { name: "cropStage", label: "Crop Stage", type: "select", options: ["Preparation", "Planting", "Growing", "Harvesting", "Post-Harvest"] },
      { name: "estimatedYieldTons", label: "Est. Yield (Tons)", type: "number", step: "0.1", unit: "Tons" },
      { name: "actualYieldTons", label: "Actual Yield (Tons)", type: "number", step: "0.1", unit: "Tons" },
      { name: "estimatedRevenue", label: "Est. Revenue (INR)", type: "number", step: "0.01", unit: "₹" },
      { name: "actualRevenue", label: "Actual Revenue (INR)", type: "number", step: "0.01", unit: "₹" },
    ],
    eventTypes: ["Planting", "Fertilization", "Irrigation", "Pest Control", "Growth Monitoring", "Harvest"],
    tableColumns: [
      { key: "hectaresAllotted", label: "Land (Ha)", type: "number" },
      { key: "cropStage", label: "Crop Stage", type: "badge" },
      { key: "seedVariety", label: "Seed Variety", type: "text" },
      { key: "estimatedYieldTons", label: "Est. Yield", type: "number", unit: "Tons" },
      { key: "estimatedRevenue", label: "Est. Revenue", type: "currency" },
    ],
    kpiCards: [
      { label: "Total Land Allotted", key: "hectaresAllotted", unit: "Ha", aggregate: "sum", icon: "terrain" },
      { label: "Est. Yield Forecast", key: "estimatedYieldTons", unit: "Tons", aggregate: "sum", icon: "grain" },
      { label: "Est. Revenue", key: "estimatedRevenue", aggregate: "sum", format: "currency", icon: "payments" },
    ],
    programTargetUnit: "Ha",
  },

  rice_cultivation: {
    category: "FARM",
    label: "Rice Cultivation",
    icon: "rice_bowl",
    description: "Monitor paddy field allocation, yield, and revenue tracking.",
    fields: [
      { name: "hectaresAllotted", label: "Land Allotted (Ha)", type: "number", step: "0.1", unit: "Ha" },
      { name: "riceVariety", label: "Rice Variety", type: "text" },
      { name: "soilType", label: "Soil Type", type: "select", options: ["Clay Loam", "Sandy Loam", "Alluvial", "Saline"] },
      { name: "waterSource", label: "Water Source", type: "select", options: ["Canal", "Rainfed", "Tube Well", "Borewell"] },
      { name: "cropStage", label: "Crop Stage", type: "select", options: ["Nursery", "Transplanting", "Tillering", "Flowering", "Harvesting"] },
      { name: "estimatedYieldTons", label: "Est. Yield (Tons)", type: "number", step: "0.1", unit: "Tons" },
      { name: "actualYieldTons", label: "Actual Yield (Tons)", type: "number", step: "0.1", unit: "Tons" },
      { name: "estimatedRevenue", label: "Est. Revenue (INR)", type: "number", step: "0.01", unit: "₹" },
      { name: "actualRevenue", label: "Actual Revenue (INR)", type: "number", step: "0.01", unit: "₹" },
    ],
    eventTypes: ["Planting", "Fertilization", "Irrigation", "Pest Control", "Growth Monitoring", "Harvest"],
    tableColumns: [
      { key: "hectaresAllotted", label: "Land (Ha)", type: "number" },
      { key: "cropStage", label: "Crop Stage", type: "badge" },
      { key: "riceVariety", label: "Variety", type: "text" },
      { key: "estimatedYieldTons", label: "Est. Yield", type: "number", unit: "Tons" },
      { key: "estimatedRevenue", label: "Est. Revenue", type: "currency" },
    ],
    kpiCards: [
      { label: "Total Land Allotted", key: "hectaresAllotted", unit: "Ha", aggregate: "sum", icon: "terrain" },
      { label: "Est. Yield Forecast", key: "estimatedYieldTons", unit: "Tons", aggregate: "sum", icon: "grain" },
      { label: "Est. Revenue", key: "estimatedRevenue", aggregate: "sum", format: "currency", icon: "payments" },
    ],
    programTargetUnit: "Ha",
  },

  // ─── Non-Farm (Livestock / Allied) ───
  goat_rearing: {
    category: "NON_FARM",
    label: "Goat Rearing",
    icon: "pets",
    description: "Livestock distribution, vaccination tracking, and flock growth metrics.",
    fields: [
      { name: "goatsAssigned", label: "Goats Assigned", type: "number", unit: "animals" },
      { name: "investment", label: "Investment (INR)", type: "number", step: "0.01", unit: "₹" },
      { name: "returnsAmount", label: "Returns (INR)", type: "number", step: "0.01", unit: "₹" },
      { name: "roiPercentage", label: "ROI (%)", type: "number", step: "0.01", unit: "%" },
      { name: "advantagesLog", label: "Advantages Log", type: "textarea" },
    ],
    eventTypes: ["Death", "Pregnancy", "ChildBirth", "Vaccination", "Health Check", "Sale"],
    tableColumns: [
      { key: "goatsAssigned", label: "Goats", type: "number" },
      { key: "investment", label: "Investment", type: "currency" },
      { key: "returnsAmount", label: "Returns", type: "currency" },
      { key: "roiPercentage", label: "ROI", type: "number", unit: "%" },
    ],
    kpiCards: [
      { label: "Total Goats Assigned", key: "goatsAssigned", unit: "animals", aggregate: "sum", icon: "pets" },
      { label: "Total Investment", key: "investment", aggregate: "sum", format: "currency", icon: "savings" },
      { label: "Avg. ROI", key: "roiPercentage", aggregate: "avg", format: "percent", icon: "trending_up" },
    ],
    programTargetUnit: "goats",
  },

  fish_farming: {
    category: "NON_FARM",
    label: "Fish Farming",
    icon: "phishing",
    description: "Pond management, fish stock tracking, and harvest monitoring.",
    fields: [
      { name: "pondSize", label: "Pond Size (sq.m)", type: "number", step: "0.1", unit: "sq.m" },
      { name: "fishCount", label: "Fish Stocked", type: "number", unit: "fingerlings" },
      { name: "fishSpecies", label: "Fish Species", type: "select", options: ["Rohu", "Catla", "Mrigal", "Common Carp", "Grass Carp", "Tilapia", "Pangasius"] },
      { name: "feedType", label: "Feed Type", type: "text" },
      { name: "estimatedHarvestKg", label: "Est. Harvest (Kg)", type: "number", step: "0.1", unit: "Kg" },
      { name: "actualHarvestKg", label: "Actual Harvest (Kg)", type: "number", step: "0.1", unit: "Kg" },
      { name: "estimatedRevenue", label: "Est. Revenue (INR)", type: "number", step: "0.01", unit: "₹" },
      { name: "actualRevenue", label: "Actual Revenue (INR)", type: "number", step: "0.01", unit: "₹" },
    ],
    eventTypes: ["Stocking", "Feeding", "Water Quality Check", "Health Check", "Partial Harvest", "Final Harvest"],
    tableColumns: [
      { key: "pondSize", label: "Pond (sq.m)", type: "number" },
      { key: "fishCount", label: "Fish Stocked", type: "number" },
      { key: "fishSpecies", label: "Species", type: "text" },
      { key: "estimatedHarvestKg", label: "Est. Harvest", type: "number", unit: "Kg" },
      { key: "estimatedRevenue", label: "Est. Revenue", type: "currency" },
    ],
    kpiCards: [
      { label: "Total Pond Area", key: "pondSize", unit: "sq.m", aggregate: "sum", icon: "water" },
      { label: "Fish Stocked", key: "fishCount", aggregate: "sum", icon: "phishing" },
      { label: "Est. Harvest", key: "estimatedHarvestKg", unit: "Kg", aggregate: "sum", icon: "grain" },
    ],
    programTargetUnit: "sq.m",
  },

  poultry_farming: {
    category: "NON_FARM",
    label: "Poultry Farming",
    icon: "egg",
    description: "Bird distribution, egg production, and health tracking.",
    fields: [
      { name: "birdsAssigned", label: "Birds Assigned", type: "number", unit: "birds" },
      { name: "breed", label: "Breed", type: "select", options: ["Kadaknath", "Vanaraja", "Rhode Island Red", "White Leghorn", "Aseel", "Broiler"] },
      { name: "housingType", label: "Housing Type", type: "select", options: ["Deep Litter", "Cage System", "Free Range", "Semi-Intensive"] },
      { name: "investment", label: "Investment (INR)", type: "number", step: "0.01", unit: "₹" },
      { name: "returnsAmount", label: "Returns (INR)", type: "number", step: "0.01", unit: "₹" },
      { name: "roiPercentage", label: "ROI (%)", type: "number", step: "0.01", unit: "%" },
    ],
    eventTypes: ["Distribution", "Vaccination", "Health Check", "Egg Collection", "Sale", "Mortality"],
    tableColumns: [
      { key: "birdsAssigned", label: "Birds", type: "number" },
      { key: "breed", label: "Breed", type: "text" },
      { key: "housingType", label: "Housing", type: "badge" },
      { key: "investment", label: "Investment", type: "currency" },
      { key: "roiPercentage", label: "ROI", type: "number", unit: "%" },
    ],
    kpiCards: [
      { label: "Total Birds Assigned", key: "birdsAssigned", aggregate: "sum", icon: "egg" },
      { label: "Total Investment", key: "investment", aggregate: "sum", format: "currency", icon: "savings" },
      { label: "Avg. ROI", key: "roiPercentage", aggregate: "avg", format: "percent", icon: "trending_up" },
    ],
    programTargetUnit: "birds",
  },
};

export function getTypeConfig(type) {
  return LIVELIHOOD_TYPES[type] || null;
}

export function getTypesByCategory(category) {
  return Object.entries(LIVELIHOOD_TYPES)
    .filter(([, config]) => config.category === category)
    .map(([type, config]) => ({ type, ...config }));
}

export function getAllTypes() {
  return Object.entries(LIVELIHOOD_TYPES).map(([type, config]) => ({
    type,
    ...config,
  }));
}

export function getFieldsForType(type) {
  const config = LIVELIHOOD_TYPES[type];
  return config ? config.fields : [];
}

export function getDefaultAttributes(type) {
  const fields = getFieldsForType(type);
  const attrs = {};
  for (const field of fields) {
    if (field.type === "number") {
      attrs[field.name] = "";
    } else if (field.type === "select") {
      attrs[field.name] = field.options[0];
    } else {
      attrs[field.name] = "";
    }
  }
  return attrs;
}

export function formatFieldValue(value, field) {
  if (value === null || value === undefined || value === "") return "—";
  if (field.type === "currency") {
    return `₹${Number(value).toLocaleString("en-IN")}`;
  }
  if (field.type === "number") {
    const num = Number(value);
    const suffix = field.unit ? ` ${field.unit}` : "";
    return `${num.toLocaleString("en-IN")}${suffix}`;
  }
  return String(value);
}

export { LIVELIHOOD_TYPES };
export default LIVELIHOOD_TYPES;
