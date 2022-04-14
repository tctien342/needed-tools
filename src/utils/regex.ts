const CommonRegex = {
  hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
  number: /^-?\d*\.?\d*$/,
  phone: /^\+?[\d\s]{8,}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export { CommonRegex };
