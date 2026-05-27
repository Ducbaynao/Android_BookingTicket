package com.example.Android.shared.exception;

public abstract class ApplicationException extends RuntimeException {

    private final String errorCode;

    protected ApplicationException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
