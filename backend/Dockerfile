# --- Build stage ---
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj first and restore packages (cache-friendly)
COPY DigitalButler.Api.csproj ./
RUN dotnet restore

# Copy everything else and publish a release build
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

# --- Runtime stage ---
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .

# Render injects a PORT env var — tell ASP.NET Core to listen on it
# Fallback to 10000 (Render's default) if not set
ENTRYPOINT ["sh", "-c", "dotnet DigitalButler.Api.dll --urls http://+:${PORT:-10000}"]

