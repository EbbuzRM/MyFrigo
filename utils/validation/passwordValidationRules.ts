export const validatePassword = (password: string) => {
  const validation = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  return {
    isValid: Object.values(validation).every((rule) => rule),
    validation,
  };
};

export const validatePasswordMatch = (
  newPassword: string,
  confirmPassword: string
) => {
  return newPassword === confirmPassword && newPassword.length > 0;
};

export const validateCurrentPassword = (password: string): boolean => {
  return password.length > 0;
};
