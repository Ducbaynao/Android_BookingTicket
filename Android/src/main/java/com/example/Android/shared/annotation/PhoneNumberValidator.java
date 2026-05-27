package com.example.Android.shared.annotation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PhoneNumberValidator implements ConstraintValidator<PhoneNumber, String> {

    private int size;

    @Override
    public void initialize(PhoneNumber annotation) {
        this.size = annotation.size();
    }

    @Override
    public boolean isValid(String phoneNumber, ConstraintValidatorContext context) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return true; // Let @NotBlank handle this case
        }
        if (phoneNumber.length() != size) {
            return false; // Check for exact length of 10 digits
        }
        // Simple regex for phone number validation (you can customize it as needed)
        String regex = "^[+]?[0-9]{10,15}$";
        return phoneNumber.matches(regex);
    }

}
