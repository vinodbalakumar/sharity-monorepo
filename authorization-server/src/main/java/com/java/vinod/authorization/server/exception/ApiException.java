package com.java.vinod.authorization.server.exception;

import org.springframework.http.HttpStatus;

/**
 * Maps business-rule failures to a specific HTTP status for the identity API.
 *
 * <p>The exception keeps controller and service code readable while preserving
 * a simple, safe way to return status-aware error responses.</p>
 */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    /**
     * Creates an API exception with the caller-facing status and message.
     */
    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    /**
     * Returns the HTTP status that should be sent to the caller.
     */
    public HttpStatus getStatus() {
        return status;
    }
}
