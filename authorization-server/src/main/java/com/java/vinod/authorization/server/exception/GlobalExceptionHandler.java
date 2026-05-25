package com.java.vinod.authorization.server.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ProblemDetail handleApiException(ApiException exception, HttpServletRequest request) {
        return problem(exception.getStatus(), exception.getStatus().getReasonPhrase(), exception.getMessage(), request, "API_ERROR");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        return validationProblem(toFieldErrors(exception.getBindingResult().getFieldErrors()), request);
    }

    @ExceptionHandler(BindException.class)
    public ProblemDetail handleBindException(BindException exception, HttpServletRequest request) {
        return validationProblem(toFieldErrors(exception.getBindingResult().getFieldErrors()), request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ProblemDetail handleConstraintViolation(ConstraintViolationException exception, HttpServletRequest request) {
        Map<String, List<String>> fieldErrors = exception.getConstraintViolations().stream()
                .collect(Collectors.groupingBy(
                        violation -> violation.getPropertyPath().toString(),
                        TreeMap::new,
                        Collectors.mapping(violation -> violation.getMessage(), Collectors.toList())
                ));
        return validationProblem(fieldErrors, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadableMessage(HttpMessageNotReadableException exception, HttpServletRequest request) {
        return problem(HttpStatus.BAD_REQUEST, "Bad Request", "Request body must be valid JSON", request, "MALFORMED_JSON");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ProblemDetail handleMissingParameter(MissingServletRequestParameterException exception, HttpServletRequest request) {
        String message = "Missing required request parameter: " + exception.getParameterName();
        ProblemDetail detail = problem(HttpStatus.BAD_REQUEST, "Bad Request", message, request, "VALIDATION_FAILED");
        detail.setProperty("errors", List.of(message));
        detail.setProperty("fieldErrors", Map.of(exception.getParameterName(), List.of("This parameter is required")));
        return detail;
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException exception, HttpServletRequest request) {
        String message = exception.getName() + " has an invalid value";
        ProblemDetail detail = problem(HttpStatus.BAD_REQUEST, "Bad Request", message, request, "VALIDATION_FAILED");
        detail.setProperty("errors", List.of(message));
        detail.setProperty("fieldErrors", Map.of(exception.getName(), List.of("Invalid value")));
        return detail;
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDetail handleMethodNotSupported(HttpRequestMethodNotSupportedException exception, HttpServletRequest request) {
        return problem(HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed", exception.getMessage(), request, "METHOD_NOT_ALLOWED");
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ProblemDetail handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException exception, HttpServletRequest request) {
        return problem(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported Media Type", exception.getMessage(), request, "UNSUPPORTED_MEDIA_TYPE");
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException exception, HttpServletRequest request) {
        return problem(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid credentials", request, "UNAUTHORIZED");
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception exception, HttpServletRequest request) {
        return problem(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", "Unexpected server error", request, "INTERNAL_SERVER_ERROR");
    }

    private ProblemDetail validationProblem(Map<String, List<String>> fieldErrors, HttpServletRequest request) {
        List<String> errors = fieldErrors.entrySet().stream()
                .flatMap(entry -> entry.getValue().stream().map(message -> entry.getKey() + ": " + message))
                .toList();
        ProblemDetail detail = problem(
                HttpStatus.BAD_REQUEST,
                "Bad Request",
                errors.isEmpty() ? "Request validation failed" : String.join("; ", errors),
                request,
                "VALIDATION_FAILED"
        );
        detail.setProperty("errors", errors);
        detail.setProperty("fieldErrors", fieldErrors);
        return detail;
    }

    private Map<String, List<String>> toFieldErrors(List<FieldError> errors) {
        return errors.stream()
                .collect(Collectors.groupingBy(
                        FieldError::getField,
                        TreeMap::new,
                        Collectors.mapping(this::message, Collectors.toList())
                ));
    }

    private String message(FieldError fieldError) {
        return fieldError.getDefaultMessage() == null ? "Invalid value" : fieldError.getDefaultMessage();
    }

    private ProblemDetail problem(HttpStatusCode status, String title, String message, HttpServletRequest request, String errorCode) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(status, message);
        detail.setTitle(title);
        detail.setProperty("errorCode", errorCode);
        detail.setProperty("path", request.getRequestURI());
        detail.setProperty("timestamp", Instant.now().toString());
        return detail;
    }
}
