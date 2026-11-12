// Qui definisci i colori principali dell'app
export const COLORS = {
  primary: '#007BFF',
  secondary: '#6C757D',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#212529',
  textLight: '#6C757D',
  border: '#DEE2E6',
};

// Qui definisci le metriche standard (padding, margin, bordi)
export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 20,
  extraLarge: 24,
  padding: 16,
  radius: 8,
};

// Qui definisci le ombreggiature base per mantenere coerenza
export const SHADOWS = {
  light: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
};