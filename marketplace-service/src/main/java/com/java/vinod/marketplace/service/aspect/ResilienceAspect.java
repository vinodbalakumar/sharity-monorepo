package com.java.vinod.marketplace.service.aspect;

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
 * AOP aspect for applying resilience patterns (retry) in marketplace service.
 *
 * Usage:
 *   @Retryable("database-retry")
 *   public void saveCart() { ... }
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class ResilienceAspect {
    private final RetryRegistry retryRegistry;

    @Around("@annotation(com.java.vinod.marketplace.service.aspect.Retryable)")
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
}
