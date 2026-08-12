export const CLIENT_PLANS = {
  basic: {
    value: 'basic',
    label: 'Basic',
    price: 150,
    applicationLimit: 100,
  },
  standard: {
    value: 'standard',
    label: 'Standard',
    price: 200,
    applicationLimit: 200,
  },
  premium: {
    value: 'premium',
    label: 'Premium',
    price: 250,
    applicationLimit: 300,
  },
  quarterly: {
    value: 'quarterly',
    label: 'Quarterly',
    price: 750,
    applicationLimit: 1000,
  },
};

export const CLIENT_PLAN_OPTIONS = Object.values(CLIENT_PLANS);

export function getClientPlan(plan) {
  return CLIENT_PLANS[plan] || null;
}
