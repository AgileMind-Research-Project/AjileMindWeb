/**
 * Password Validation Utilities
 * 
 * Client-side password validation matching backend policy
 */

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  requirements: PasswordRequirements;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export const PASSWORD_POLICY = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SYMBOLS: true,
};

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];
  
  // Check minimum length
  const minLength = password.length >= PASSWORD_POLICY.MIN_LENGTH;
  if (!minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.MIN_LENGTH} characters`);
  }
  
  // Check uppercase
  const hasUppercase = /[A-Z]/.test(password);
  if (PASSWORD_POLICY.REQUIRE_UPPERCASE && !hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check lowercase
  const hasLowercase = /[a-z]/.test(password);
  if (PASSWORD_POLICY.REQUIRE_LOWERCASE && !hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check numbers
  const hasNumber = /\d/.test(password);
  if (PASSWORD_POLICY.REQUIRE_NUMBERS && !hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  // Check symbols
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  if (PASSWORD_POLICY.REQUIRE_SYMBOLS && !hasSymbol) {
    errors.push('Password must contain at least one symbol');
  }
  
  const requirements: PasswordRequirements = {
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSymbol,
  };
  
  const isValid = errors.length === 0;
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  
  if (metRequirements >= 5 && password.length >= 12) {
    strength = 'strong';
  } else if (metRequirements >= 4 && password.length >= 8) {
    strength = 'medium';
  }
  
  return {
    isValid,
    requirements,
    errors,
    strength,
  };
};

export const generatePasswordStrengthLabel = (strength: 'weak' | 'medium' | 'strong'): string => {
  const labels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };
  return labels[strength];
};

export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
  const colors = {
    weak: 'red',
    medium: 'orange',
    strong: 'green',
  };
  return colors[strength];
};
