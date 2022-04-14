const CACHE_TIME_TEMPLATE = {
  '1min': 60000,
  '2min': 120000,
  '5min': 300000,
  '1hr': 3600000,
  '12hr': 43200000,
  '1day': 86400000,
  '2day': 172800000,
  '7day': 604800000,
};

const DEFAULT_CACHE_TIME = CACHE_TIME_TEMPLATE['1min'];

export { CACHE_TIME_TEMPLATE, DEFAULT_CACHE_TIME };
