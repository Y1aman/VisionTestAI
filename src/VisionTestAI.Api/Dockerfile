# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["src/VisionTestAI.Domain/VisionTestAI.Domain.csproj", "VisionTestAI.Domain/"]
COPY ["src/VisionTestAI.Application/VisionTestAI.Application.csproj", "VisionTestAI.Application/"]
COPY ["src/VisionTestAI.Infrastructure/VisionTestAI.Infrastructure.csproj", "VisionTestAI.Infrastructure/"]
COPY ["src/VisionTestAI.Api/VisionTestAI.Api.csproj", "VisionTestAI.Api/"]
RUN dotnet restore "VisionTestAI.Api/VisionTestAI.Api.csproj"

COPY src/ .
RUN dotnet publish "VisionTestAI.Api/VisionTestAI.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install Node.js and Playwright browsers with dependencies
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g playwright@1.49.0 \
    && npx playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

ENV PLAYWRIGHT_BROWSERS_PATH=/root/.cache/ms-playwright
ENV ASPNETCORE_ENVIRONMENT=Production

# Render injects PORT env var; default to 8080
ENV PORT=8080
ENV ASPNETCORE_URLS=http://+:${PORT}

EXPOSE ${PORT}
ENTRYPOINT ["dotnet", "VisionTestAI.Api.dll"]
