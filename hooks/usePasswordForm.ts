import { useState } from 'react';

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type PasswordField = keyof PasswordFormValues;

export const usePasswordForm = () => {
  const [values, setValues] = useState<PasswordFormValues>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (field: PasswordField, value: string) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setValues({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return {
    values,
    handleChange,
    resetForm,
  };
};
