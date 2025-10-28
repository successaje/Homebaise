export const formatCurrency = (amount: number | null | undefined, currency = 'USD'): string => {
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number | null | undefined): string => {
  if (num == null) return 'N/A';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toLocaleString();
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Invalid Date';
  }
};

export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const getPropertyTypeLabel = (type: string | null | undefined): string => {
  if (!type) return 'Unknown';
  const labels = {
    residential: 'Residential',
    commercial: 'Commercial',
    agricultural: 'Agricultural',
    'mixed-use': 'Mixed Use',
    land: 'Land',
  };
  return labels[type as keyof typeof labels] || type;
};

export const getCountryFlag = (country: string | null | undefined): string => {
  if (!country) return '🌍';
  const flags: Record<string, string> = {
    'Nigeria': '🇳🇬',
    'Kenya': '🇰🇪',
    'South Africa': '🇿🇦',
    'Ghana': '🇬🇭',
    'Rwanda': '🇷🇼',
  };
  return flags[country] || '🌍';
}; 