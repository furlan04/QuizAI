using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace gateway.Tests;

public class GatewayIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public GatewayIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task HealthCheck_ReturnsOk()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        Assert.Equal("Gateway is running", content);
    }

    [Fact]
    public async Task Cors_AllowsFrontendOrigin()
    {
        var client = _factory.CreateClient();
        
        var request = new HttpRequestMessage(HttpMethod.Options, "/health");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        // La preflight request CORS in .NET ritorna tipicamente 204 No Content
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.True(response.Headers.Contains("Access-Control-Allow-Origin"));
        Assert.Equal("http://localhost:3000", response.Headers.GetValues("Access-Control-Allow-Origin").First());
    }

    [Theory]
    [InlineData("/auth/login")]
    [InlineData("/quiz/generate")]
    [InlineData("/users/me")]
    public async Task Yarp_Routes_Correctly_And_Returns_502_When_Downstream_Is_Unreachable(string path)
    {
        // Poiché i microservizi veri non sono in esecuzione durante questo test (o l'host è inesistente), 
        // YARP cercherà di inoltrare la richiesta e fallirà restituendo 502 Bad Gateway.
        // Se YARP *non* intercettasse la route, ASP.NET restituirebbe 404 Not Found.
        var client = _factory.CreateClient();
        var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }
}
