FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Sangu.Tms.sln ./
COPY src/Sangu.Tms.Api/Sangu.Tms.Api.csproj src/Sangu.Tms.Api/
COPY src/Sangu.Tms.Application/Sangu.Tms.Application.csproj src/Sangu.Tms.Application/
COPY src/Sangu.Tms.Domain/Sangu.Tms.Domain.csproj src/Sangu.Tms.Domain/
COPY src/Sangu.Tms.Infrastructure/Sangu.Tms.Infrastructure.csproj src/Sangu.Tms.Infrastructure/

RUN dotnet restore src/Sangu.Tms.Api/Sangu.Tms.Api.csproj

COPY . .
RUN dotnet publish src/Sangu.Tms.Api/Sangu.Tms.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "Sangu.Tms.Api.dll"]
