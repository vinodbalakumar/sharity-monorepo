FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/platform-ai-service-0.0.1-SNAPSHOT.jar app.jar
RUN mkdir /app/data && chown -R 10001:10001 /app
USER 10001:10001
EXPOSE 8086
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=65", "-jar", "app.jar"]
