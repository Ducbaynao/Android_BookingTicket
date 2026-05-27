// Form validation utilities with user-friendly error messages in English

export const ValidationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format'
  },
  phone: {
    pattern: /^(\+84|84|0)[3|5|7|8|9][0-9]{8}$/,
    message: 'Invalid phone number (Ex: 0912345678)'
  },
  password: {
    minLength: 6,
    pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
    message: 'Password must be at least 6 characters with letters and numbers'
  },
  required: {
    message: 'This field is required'
  },
  fullName: {
    minLength: 2,
    pattern: /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔưăâêô\s]+$/,
    message: 'Full name can only contain letters and spaces'
  }
};

export const validateField = (value, rules = []) => {
  const errors = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || value.toString().trim() === '') {
          errors.push(rule.message || ValidationRules.required.message);
        }
        break;

      case 'email':
        if (value && !ValidationRules.email.pattern.test(value)) {
          errors.push(rule.message || ValidationRules.email.message);
        }
        break;

      case 'phone':
        if (value && !ValidationRules.phone.pattern.test(value)) {
          errors.push(rule.message || ValidationRules.phone.message);
        }
        break;

      case 'password':
        if (value) {
          if (value.length < ValidationRules.password.minLength) {
            errors.push(`Mật khẩu phải có ít nhất ${ValidationRules.password.minLength} ký tự`);
          }
          if (!ValidationRules.password.pattern.test(value)) {
            errors.push(rule.message || ValidationRules.password.message);
          }
        }
        break;

      case 'confirmPassword':
        if (value && value !== rule.password) {
          errors.push('Mật khẩu xác nhận không khớp');
        }
        break;

      case 'fullName':
        if (value) {
          if (value.length < ValidationRules.fullName.minLength) {
            errors.push('Họ tên phải có ít nhất 2 ký tự');
          }
          if (!ValidationRules.fullName.pattern.test(value)) {
            errors.push(rule.message || ValidationRules.fullName.message);
          }
        }
        break;

      case 'minLength':
        if (value && value.length < rule.min) {
          errors.push(`Phải có ít nhất ${rule.min} ký tự`);
        }
        break;

      case 'maxLength':
        if (value && value.length > rule.max) {
          errors.push(`Không được vượt quá ${rule.max} ký tự`);
        }
        break;

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          errors.push(rule.message);
        }
        break;
    }
  }

  return errors;
};

export const validateForm = (formData, fieldRules) => {
  const errors = {};
  let isValid = true;

  Object.keys(fieldRules).forEach(fieldName => {
    const fieldErrors = validateField(formData[fieldName], fieldRules[fieldName]);
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Real-time validation hook
import { useState, useCallback } from 'react';

export const useFormValidation = (initialData, fieldRules) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = useCallback((fieldName, value) => {
    const fieldErrors = validateField(value, fieldRules[fieldName] || []);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: fieldErrors.length > 0 ? fieldErrors : undefined
    }));

    return fieldErrors.length === 0;
  }, [fieldRules]);

  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Validate if field has been touched
    if (touched[fieldName]) {
      validateField(fieldName, value);
    }
  }, [touched, validateField]);

  const touchField = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, formData[fieldName]);
  }, [formData, validateField]);

  const validateAllFields = useCallback(() => {
    const { isValid, errors: validationErrors } = validateForm(formData, fieldRules);
    setErrors(validationErrors);
    setTouched(Object.keys(fieldRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return isValid;
  }, [formData, fieldRules]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  return {
    formData,
    errors,
    touched,
    updateField,
    touchField,
    validateField: validateField,
    validateAllFields,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
};

// Common form validation presets
export const FormPresets = {
  login: {
    email: [
      { type: 'required' },
      { type: 'email' }
    ],
    password: [
      { type: 'required' }
    ]
  },
  
  register: {
    fullName: [
      { type: 'required' },
      { type: 'fullName' }
    ],
    email: [
      { type: 'required' },
      { type: 'email' }
    ],
    phone: [
      { type: 'required' },
      { type: 'phone' }
    ],
    password: [
      { type: 'required' },
      { type: 'password' }
    ],
    confirmPassword: [
      { type: 'required' },
      { type: 'confirmPassword', password: '' } // Password will be set dynamically
    ]
  },

  changePassword: {
    currentPassword: [
      { type: 'required' }
    ],
    newPassword: [
      { type: 'required' },
      { type: 'password' }
    ],
    confirmPassword: [
      { type: 'required' },
      { type: 'confirmPassword', password: '' }
    ]
  },

  profile: {
    fullName: [
      { type: 'required' },
      { type: 'fullName' }
    ],
    phone: [
      { type: 'phone' }
    ]
  }
};