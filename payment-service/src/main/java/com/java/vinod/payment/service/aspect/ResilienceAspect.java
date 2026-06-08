package com.java.vinod.payment.service.aspect;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import io.github.resilience4j.core.CallableUtils;
import io.github.resilience4j.retry.Retry;
import io.github.resilience4j.retry.RetryRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.concurrent.Callable;

/**
 * AOP aspect for applying resilience patterns (retry, circuit breaker).
 *
 * Usage:
 *   @Retryable
 *   @CircuitBreakerProtected
 *   public void someMethod() { ... }
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ResilienceAspect {
    private final RetryRegistry retryRegistry;
    private final CircuitBreakerRegistry circuitBreakerRegistry;

    @Around("@annotation(com.java.vinod.payment.service.aspect.Retryable)")
    public Object handleRetry(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Retryable annotation = method.getAnnotation(Retryable.class);

        String retryName = annotation.value();
        Retry retry = retryRegistry.retry(retryName);

        log.debug("Applying retry policy '{}' to method '{}'", retryName, method.getName());

        Callable<Object> callable = () -> {
            try {
                return joinPoint.proceed();
            } catch (Throwable throwable) {
                throw (Exception) throwable;
            }
        };

        return retry.executeCallable(callable);
    }

    @Around("@annotation(com.java.vinod.payment.service.aspect.CircuitBreakerProtected)")
    public Object handleCircuitBreaker(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        CircuitBreakerProtected annotation = method.getAnnotation(CircuitBreakerProtected.class);

        String circuitBreakerName = annotation.value();
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(circuitBreakerName);

        log.debug("Applying circuit breaker '{}' to method '{}'", circuitBreakerName, method.getName());

        Callable<Object> callable = () -> {
            try {
                return joinPoint.proceed();
            } catch (Throwable throwable) {
                throw (Exception) throwable;
            }
        };

        return circuitBreaker.executeCallable(callable);
    }

    @Around("@annotation(com.java.vinod.payment.service.aspect.Retryable) && @annotation(com.java.vinod.payment.service.aspect.CircuitBreakerProtected)")
    public Object handleRetryAndCircuitBreaker(ProceedingJoinPoint joinPoint) throws Throwable {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        Retryable retryAnnotation = method.getAnnotation(Retryable.class);
        CircuitBreakerProtected cbAnnotation = method.getAnnotation(CircuitBreakerProtected.class);

        String retryName = retryAnnotation.value();
        String circuitBreakerName = cbAnnotation.value();
        Retry retry = retryRegistry.retry(retryName);
        CircuitBreaker circuitBreaker = circuitBreakerRegistry.circuitBreaker(circuitBreakerName);

        log.debug("Applying retry '{}' and circuit breaker '{}' to method '{}'",
            retryName, circuitBreakerName, method.getName());

        Callable<Object> callable = () -> {
            try {
                return joinPoint.proceed();
            } catch (Throwable throwable) {
                throw (Exception) throwable;
            }
        };

        // Apply both: retry wraps circuit breaker
        return retry.executeCallable(circuitBreaker.decorateCallable(callable));
    }
}
