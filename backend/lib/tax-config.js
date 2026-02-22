const TAX_CONFIGS = {
  sme: {
    type: 'sme',
    vatRate: 0.23,
    corpTaxRate: 0.125,
    prsiRate: 0.09,
    incomeTaxRate: null,
    uscRate: null,
  },
  individual: {
    type: 'individual',
    vatRate: null,
    corpTaxRate: null,
    prsiRate: 0.04,
    incomeTaxRate: 0.20,
    uscRate: 0.04,
  },
};

const LABELS = {
  sme: {
    primaryMetric: 'Payroll',
    taxReserve: 'VAT Reserve',
    thirdMetric: 'Corp Tax',
    insightTone: 'cfo',
  },
  individual: {
    primaryMetric: 'Monthly Income',
    taxReserve: 'Tax Reserve',
    thirdMetric: 'Bills',
    insightTone: 'personal',
  },
};

function getTaxConfig(userType) {
  if (!TAX_CONFIGS[userType]) {
    throw new Error(`Invalid user_type: "${userType}". Must be "sme" or "individual".`);
  }
  return TAX_CONFIGS[userType];
}

function getLabels(userType) {
  return LABELS[userType] || LABELS.sme;
}

function validateUserType(req, res, next) {
  const userType = req.query.user_type || req.body?.user_type;
  if (!userType || !['sme', 'individual'].includes(userType)) {
    return res.status(400).json({
      error: 'user_type is required and must be "sme" or "individual"',
    });
  }
  req.userType = userType;
  next();
}

module.exports = { getTaxConfig, getLabels, validateUserType };
