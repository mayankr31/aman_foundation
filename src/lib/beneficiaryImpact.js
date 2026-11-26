function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-IN");
}

function formatMetricValue(value, kpi = {}) {
  const number = toNumber(value);

  if (kpi.format === "currency") {
    return number === null ? String(value) : `₹${formatNumber(number)}`;
  }
  if (kpi.format === "percent") {
    return number === null ? String(value) : `${formatNumber(number)}%`;
  }
  if (number === null) return String(value);
  return kpi.unit ? `${formatNumber(number)} ${kpi.unit}` : formatNumber(number);
}

function humanizeKey(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase())
    .replace(/\bId\b/g, "ID");
}

const CURRENCY_KEYS = [
  "investment",
  "returnsAmount",
  "estimatedRevenue",
  "actualRevenue",
  "amount",
  "expense",
];
const NON_METRIC_KEYS = new Set(["notes", "advantagesLog"]);

function formatAttributeValue(key, value) {
  const number = toNumber(value);
  if (number === null) return String(value);

  const lowerKey = key.toLowerCase();
  if (CURRENCY_KEYS.some((currencyKey) => lowerKey.includes(currencyKey.toLowerCase()))) {
    return `₹${formatNumber(number)}`;
  }
  if (lowerKey.includes("percentage") || lowerKey.includes("roi")) {
    return `${formatNumber(number)}%`;
  }
  return formatNumber(number);
}

function isDisplayableAttribute(key, value) {
  if (value === null || value === undefined || value === "") return false;
  if (key.endsWith("Id")) return false;
  if (NON_METRIC_KEYS.has(key)) return false;
  return true;
}

function getSum(programs, key) {
  return programs.reduce((sum, program) => {
    const value = toNumber(program.attributes?.[key]);
    return value === null ? sum : sum + value;
  }, 0);
}

function hasAttribute(programs, key) {
  return programs.some((program) => toNumber(program.attributes?.[key]) !== null);
}

function getAverage(values) {
  const valid = values.filter((value) => value !== null && value !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function buildProgram(detail, getTypeConfig) {
  const attributes =
    detail.attributes && typeof detail.attributes === "object" ? detail.attributes : {};
  const type = detail.typeKey || detail.program?.type || "";
  const config = typeof getTypeConfig === "function" ? getTypeConfig(type) : null;
  const category = config?.category || detail.program?.category || "UNKNOWN";
  const events = Array.isArray(detail.events) ? detail.events : [];

  const kpiCards = (Array.isArray(config?.kpiCards) ? config.kpiCards : []).filter(
    (kpi) => kpi.key !== "roiPercentage"
  );

  const kpis = kpiCards
    .map((kpi) => {
      const value = attributes[kpi.key];
      if (value === null || value === undefined || value === "") return null;
      return {
        key: kpi.key,
        label: kpi.label || humanizeKey(kpi.key),
        formatted: formatMetricValue(value, kpi),
      };
    })
    .filter(Boolean);

  if (kpis.length === 0) {
    Object.entries(attributes).forEach(([key, value]) => {
      if (!isDisplayableAttribute(key, value)) return;
      kpis.push({
        key,
        label: humanizeKey(key),
        formatted: formatAttributeValue(key, value),
      });
    });
  }

  const optionalMetrics = [
    { key: "estimatedRevenue", label: "Est. Revenue", format: "currency" },
    { key: "actualYieldTons", label: "Actual Yield", unit: "Tons" },
    { key: "actualRevenue", label: "Actual Revenue", format: "currency" },
    { key: "actualHarvestKg", label: "Actual Harvest", unit: "Kg" },
    { key: "investment", label: "Investment", format: "currency" },
    { key: "returnsAmount", label: "Returns", format: "currency" },
  ];
  optionalMetrics.forEach((metric) => {
    const value = attributes[metric.key];
    if (value === null || value === undefined || value === "") return;
    if (kpis.some((kpi) => kpi.key === metric.key)) return;
    kpis.push({
      key: metric.key,
      label: metric.label,
      formatted: formatMetricValue(value, metric),
    });
  });

  const computed = [];
  const estimatedYield = toNumber(attributes.estimatedYieldTons);
  const actualYield = toNumber(attributes.actualYieldTons);
  if (estimatedYield !== null && estimatedYield > 0 && actualYield !== null) {
    const percentage = Math.round((actualYield / estimatedYield) * 100);
    computed.push({
      key: "yieldEfficiency",
      label: "Yield Efficiency",
      formatted: `${percentage}%`,
      progress: clampPercent(percentage),
    });
  }

  const estimatedRevenue = toNumber(attributes.estimatedRevenue);
  const actualRevenue = toNumber(attributes.actualRevenue);
  if (estimatedRevenue !== null && estimatedRevenue > 0 && actualRevenue !== null) {
    const percentage = Math.round((actualRevenue / estimatedRevenue) * 100);
    computed.push({
      key: "revenueAchievement",
      label: "Revenue Achievement",
      formatted: `${percentage}%`,
      progress: clampPercent(percentage),
    });
  }

  const investment = toNumber(attributes.investment);
  const returnsAmount = toNumber(attributes.returnsAmount);
  const storedRoi = toNumber(attributes.roiPercentage);
  let roi = storedRoi;
  if (
    roi === null &&
    investment !== null &&
    investment > 0 &&
    returnsAmount !== null
  ) {
    roi = Math.round(((returnsAmount - investment) / investment) * 100);
  }
  if (roi !== null) {
    computed.push({
      key: "roi",
      label: storedRoi === null ? "Computed ROI" : "ROI",
      formatted: `${Math.round(roi)}%`,
      progress: clampPercent(roi),
    });
  }

  const eventDates = events
    .map((event) => event.eventDate)
    .filter(Boolean)
    .map((date) => new Date(date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return {
    id: detail.id,
    programId: detail.programId || detail.program?.id || detail.id,
    name: detail.program?.name || config?.label || "Unknown Program",
    programName: detail.program?.name || config?.label || "Unknown Program",
    programCategory: detail.program?.category || config?.category || "UNKNOWN",
    category,
    type,
    typeLabel: config?.label || humanizeKey(type || "Program"),
    enrolledAt: detail.enrolledAt || detail.createdAt || null,
    notes: detail.notes || "",
    attributes,
    kpis,
    computed,
    eventCount: events.length,
    lastEventDate: eventDates[0] || null,
  };
}

function typeLabelForDetail(detail, getTypeConfig) {
  const type = detail.typeKey || detail.program?.type || "";
  const config = typeof getTypeConfig === "function" ? getTypeConfig(type) : null;
  return config?.label || humanizeKey(type || "Program");
}

/**
 * Groups raw BeneficiaryLivelihood rows (one row per program component) into
 * one entry per program. Use this anywhere the UI lists a participant's
 * programs so an integrated program is shown once with all its activities.
 */
export function groupLivelihoodDetails(details, getTypeConfig) {
  const groups = new Map();

  (Array.isArray(details) ? details : []).forEach((detail) => {
    const program = detail.program || {};
    const key = detail.programId || program.id || detail.id;
    if (!key) return;

    if (!groups.has(key)) {
      groups.set(key, {
        programId: key,
        program,
        category: program.category || "UNKNOWN",
        enrolledAt: null,
        components: [],
      });
    }

    const group = groups.get(key);
    group.components.push(detail);

    const enrolled = detail.enrolledAt || detail.createdAt || null;
    if (enrolled && (!group.enrolledAt || new Date(enrolled) < new Date(group.enrolledAt))) {
      group.enrolledAt = enrolled;
    }
  });

  const programComponentOrder = (detail) => {
    const components = detail?.program?.components;
    if (!Array.isArray(components) || components.length === 0) {
      return Number.MAX_SAFE_INTEGER;
    }
    const typeKey = detail.typeKey || detail.program?.type;
    const index = components.findIndex((component) => component.typeKey === typeKey);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };

  return Array.from(groups.values()).map((group) => ({
    ...group,
    components: [...group.components]
      .sort((a, b) => programComponentOrder(a) - programComponentOrder(b))
      .map((detail) => ({
        ...detail,
        typeLabel: typeLabelForDetail(detail, getTypeConfig),
      })),
  }));
}

function buildLegacyDetails(beneficiary) {
  const legacy = [];

  (beneficiary?.goatRearingDetails || []).forEach((detail) => {
    legacy.push({
      id: `legacy-goat-${detail.id}`,
      program: {
        name: detail.goatRearingProgram?.name || "Goat Rearing",
        category: "NON_FARM",
        type: "goat_rearing",
      },
      attributes: {
        goatsAssigned: detail.goatsAssigned,
        investment: detail.investment,
        returnsAmount: detail.returnsAmount,
        roiPercentage: detail.roiPercentage,
        advantagesLog: detail.advantagesLog,
      },
      notes: detail.notes,
      enrolledAt: detail.createdAt || detail.assignedAt,
      events: detail.events || [],
    });
  });

  (beneficiary?.sugarcaneDetails || []).forEach((detail) => {
    legacy.push({
      id: `legacy-cane-${detail.id}`,
      program: {
        name: detail.sugarcaneProgram?.name || "Sugarcane Cultivation",
        category: "FARM",
        type: "sugarcane_cultivation",
      },
      attributes: {
        hectaresAllotted: detail.hectaresAllotted,
        soilType: detail.soilType,
        waterSource: detail.waterSource,
        cropStage: detail.cropStage,
        fertilizersDistributed: detail.fertilizersDistributed,
        estimatedYieldTons: detail.estimatedYieldTons,
        actualYieldTons: detail.actualYieldTons,
        estimatedRevenue: detail.estimatedRevenue,
        actualRevenue: detail.actualRevenue,
      },
      notes: detail.notes,
      enrolledAt: detail.createdAt,
      events: [],
    });
  });

  return legacy;
}

export function computeBeneficiaryImpact(beneficiary, getTypeConfig) {
  const unifiedDetails = Array.isArray(beneficiary?.livelihoodDetails)
    ? beneficiary.livelihoodDetails
    : [];

  let sourceDetails = unifiedDetails;
  let usingLegacy = false;

  if (sourceDetails.length === 0) {
    const legacyDetails = buildLegacyDetails(beneficiary);
    if (legacyDetails.length > 0) {
      sourceDetails = legacyDetails;
      usingLegacy = true;
    }
  }

  const componentPrograms = sourceDetails.map((detail) => buildProgram(detail, getTypeConfig));
  const farmComponents = componentPrograms.filter((program) => program.category === "FARM");
  const nonFarmComponents = componentPrograms.filter((program) => program.category === "NON_FARM");

  // Group component rows into one entry per program so an integrated program
  // with several activities is shown once.
  const programGroups = new Map();
  componentPrograms.forEach((component) => {
    const key = component.programId;
    if (!programGroups.has(key)) {
      programGroups.set(key, {
        id: key,
        name: component.programName,
        category: component.programCategory,
        enrolledAt: component.enrolledAt,
        components: [],
        eventCount: 0,
        lastEventDate: null,
        notes: "",
      });
    }

    const group = programGroups.get(key);
    group.components.push(component);
    group.eventCount += component.eventCount || 0;

    if (
      component.lastEventDate &&
      (!group.lastEventDate ||
        new Date(component.lastEventDate) > new Date(group.lastEventDate))
    ) {
      group.lastEventDate = component.lastEventDate;
    }
    if (
      component.enrolledAt &&
      (!group.enrolledAt || new Date(component.enrolledAt) < new Date(group.enrolledAt))
    ) {
      group.enrolledAt = component.enrolledAt;
    }
    if (!group.notes && component.notes) group.notes = component.notes;
  });

  const programs = Array.from(programGroups.values());
  const farmPrograms = programs.filter((program) => program.category === "FARM");
  const nonFarmPrograms = programs.filter((program) => program.category === "NON_FARM");
  const integratedPrograms = programs.filter(
    (program) => program.category === "MIXED" || !["FARM", "NON_FARM"].includes(program.category)
  );

  const farmHasLand = hasAttribute(farmComponents, "hectaresAllotted");
  const farmHasEstimatedYield = hasAttribute(farmComponents, "estimatedYieldTons");
  const farmHasActualYield = hasAttribute(farmComponents, "actualYieldTons");
  const farmHasEstimatedRevenue = hasAttribute(farmComponents, "estimatedRevenue");
  const farmHasActualRevenue = hasAttribute(farmComponents, "actualRevenue");

  const totalLand = farmHasLand ? getSum(farmComponents, "hectaresAllotted") : null;
  const totalEstimatedYield = farmHasEstimatedYield
    ? getSum(farmComponents, "estimatedYieldTons")
    : null;
  const totalActualYield = farmHasActualYield
    ? getSum(farmComponents, "actualYieldTons")
    : null;
  const totalEstimatedRevenue = farmHasEstimatedRevenue
    ? getSum(farmComponents, "estimatedRevenue")
    : null;
  const totalActualRevenue = farmHasActualRevenue
    ? getSum(farmComponents, "actualRevenue")
    : null;

  const yieldEfficiency =
    totalEstimatedYield !== null && totalEstimatedYield > 0 && totalActualYield !== null
      ? Math.round((totalActualYield / totalEstimatedYield) * 100)
      : null;
  const revenueAchievement =
    totalEstimatedRevenue !== null &&
    totalEstimatedRevenue > 0 &&
    totalActualRevenue !== null
      ? Math.round((totalActualRevenue / totalEstimatedRevenue) * 100)
      : null;

  const nonFarmHasInvestment = hasAttribute(nonFarmComponents, "investment");
  const nonFarmHasReturns = hasAttribute(nonFarmComponents, "returnsAmount");
  const totalInvestment = nonFarmHasInvestment
    ? getSum(nonFarmComponents, "investment")
    : null;
  const totalReturns = nonFarmHasReturns
    ? getSum(nonFarmComponents, "returnsAmount")
    : null;

  const averageRoi = getAverage(
    nonFarmComponents
      .map((program) => toNumber(program.attributes?.roiPercentage))
      .filter((value) => value !== null)
  );

  let portfolioRoi = null;
  if (
    totalInvestment !== null &&
    totalInvestment > 0 &&
    totalReturns !== null
  ) {
    portfolioRoi = Math.round(((totalReturns - totalInvestment) / totalInvestment) * 100);
  } else if (averageRoi !== null) {
    portfolioRoi = Math.round(averageRoi);
  }

  const allEventDates = programs
    .map((program) => program.lastEventDate)
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime());

  return {
    programs,
    farmPrograms,
    nonFarmPrograms,
    integratedPrograms,
    usingLegacy,
    totalEvents: programs.reduce((sum, program) => sum + program.eventCount, 0),
    lastEventDate: allEventDates[0] || null,
    farmSummary: {
      count: farmPrograms.length,
      totalLand,
      yieldEfficiency,
      totalEstimatedYield,
      totalActualYield,
      totalEstimatedRevenue,
      totalActualRevenue,
      revenueAchievement,
    },
    nonFarmSummary: {
      count: nonFarmPrograms.length,
      totalInvestment,
      totalReturns,
      portfolioRoi,
      averageRoi,
    },
  };
}

export { clampPercent, formatNumber };
