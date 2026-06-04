package com.java.vinod.authorization.server.util;

public final class ValidationMessages {
    public static final String REQUIRED = "This field is required";
    public static final String EMAIL_REQUIRED = "Email is required";
    public static final String EMAIL_INVALID = "Email must be a valid email address";
    public static final String PASSWORD_REQUIRED = "Password is required";
    public static final String PASSWORD_SIZE = "Password must be between 8 and 100 characters";
    public static final String PASSWORD_COMPLEXITY = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
    public static final String NEW_PASSWORD_REQUIRED = "New password is required";
    public static final String NEW_PASSWORD_SIZE = "New password must be between 8 and 100 characters";
    public static final String NEW_PASSWORD_COMPLEXITY = "New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character";
    public static final String CURRENT_PASSWORD_REQUIRED = "Current password is required";
    public static final String TOKEN_REQUIRED = "Token is required";
    public static final String REFRESH_TOKEN_REQUIRED = "Refresh token is required";
    public static final String USERNAME_SIZE = "Username must be at most 100 characters";
    public static final String NAME_SIZE = "Name must be at most 100 characters";
    public static final String DEVICE_NAME_SIZE = "Device name must be at most 150 characters";
    public static final String PHONE_SIZE = "Phone number must be at most 30 characters";
    public static final String PHONE_REQUIRED = "Phone number is required";
    public static final String COUNTRY_CODE_REQUIRED = "Country code is required";
    public static final String COUNTRY_CODE_SIZE = "Country code must be at most 3 characters";
    public static final String COUNTRY_NAME_REQUIRED = "Country name is required";
    public static final String COUNTRY_NAME_SIZE = "Country name must be at most 100 characters";
    public static final String PHONE_DIAL_CODE_REQUIRED = "Phone dial code is required";
    public static final String PHONE_DIAL_CODE_SIZE = "Phone dial code must be at most 10 characters";
    public static final String DATE_OF_BIRTH_REQUIRED = "Date of birth is required";
    public static final String DATE_OF_BIRTH_PAST_OR_PRESENT = "Date of birth cannot be in the future";
    public static final String GENDER_REQUIRED = "Gender is required";
    public static final String GENDER_INVALID = "Gender must be one of MALE, FEMALE, OTHER, or PREFER_NOT_TO_SAY";
    public static final String PROFILE_IMAGE_URL_SIZE = "Profile image URL must be at most 500 characters";
    public static final String STATUS_REQUIRED = "Status is required";
    public static final String STATUS_INVALID = "Status must be one of PENDING_VERIFICATION, ACTIVE, LOCKED, SUSPENDED, or DELETED";
    public static final String ROLE_REQUIRED = "Role is required";
    public static final String ROLE_INVALID = "Role must contain only uppercase letters, numbers, and underscores";
    public static final String APP_CODE_REQUIRED = "Application code is required";
    public static final String APP_CODE_INVALID = "Application code must contain only uppercase letters, numbers, and underscores";
    public static final String APP_NAME_REQUIRED = "Application name is required";
    public static final String APP_NAME_SIZE = "Application name must be at most 150 characters";
    public static final String DESCRIPTION_SIZE = "Description must be at most 255 characters";
    public static final String PUBLIC_ID_INVALID = "Public ID must be a valid UUID";
    public static final String SESSION_ID_INVALID = "Session ID must be a positive number";

    public static final String PASSWORD_PATTERN = "^$|^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).+$";
    public static final String STATUS_PATTERN = "^$|(?i:^(PENDING_VERIFICATION|ACTIVE|LOCKED|SUSPENDED|DELETED)$)";
    public static final String UPPER_CODE_PATTERN = "^$|^[A-Z0-9_]+$";
    public static final String GENDER_PATTERN = "^$|^(MALE|FEMALE|OTHER|PREFER_NOT_TO_SAY)$";
    public static final String UUID_PATTERN = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    private ValidationMessages() {
    }
}
