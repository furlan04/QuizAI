using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NetArchTest.Rules;
using Xunit;

namespace AuthService.Architecture.Tests;

/// <summary>
/// Test di architettura per auth-service (struttura a vertical slice, progetto unico).
///
/// NOTA sul Domain: auth-service è costruito su ASP.NET Core Identity, quindi
/// l'entità utente <c>AppUser</c> DEVE derivare da <c>IdentityUser</c> (vincolo del
/// framework: <c>UserManager&lt;TUser&gt;</c> lo richiede). Non esiste quindi un
/// "domain layer puro" come negli altri servizi: l'accoppiamento a Identity/EF è
/// confinato nel namespace <c>AuthService.Identity</c>. La regola 2 viene perciò
/// applicata ai contratti che attraversano i confini (DTO ed eventi), che DEVONO
/// restare puri, e si verifica che Identity/EF non trapelino verso Presentation.
/// </summary>
public class ArchitectureTests
{
    private static readonly Assembly AppAssembly = typeof(AuthService.Auth.AuthController).Assembly;

    // Infrastruttura: database (EF/MySQL) + broker di messaggi (RabbitMQ/MassTransit).
    private static readonly string[] InfrastructurePackages =
    {
        "Microsoft.EntityFrameworkCore",
        "Pomelo",
        "MySql",
        "MySqlConnector",
        "MassTransit",
        "RabbitMQ",
        "MongoDB",
    };

    // ── Regola 1 ──────────────────────────────────────────────────────────────
    // I Controller (Presentation) NON devono dipendere da Infrastruttura (DB/MySQL),
    // da RabbitMQ, né direttamente da ASP.NET Identity: devono passare per
    // l'Application Layer (IAuthService, IJwtTokenGenerator…).
    [Fact]
    public void Controllers_should_not_depend_on_infrastructure_messaging_or_identity()
    {
        var forbidden = InfrastructurePackages
            .Append("Microsoft.AspNetCore.Identity")
            .ToArray();

        var result = Types.InAssembly(AppAssembly)
            .That().HaveNameEndingWith("Controller")
            .Should().NotHaveDependencyOnAny(forbidden)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "i Controller devono comunicare solo tramite l'Application Layer, non con DB/RabbitMQ/Identity. " +
            "Tipi che violano la regola: " + Describe(result));
    }

    // ── Regola 2 (adattata) ────────────────────────────────────────────────────
    // I DTO (contratti richieste/risposte API che attraversano i confini) devono
    // essere puri: nessuna dipendenza da persistenza, Identity, broker o web.
    // (L'entità AppUser è intenzionalmente un'entità ASP.NET Identity e non rientra qui;
    //  la purezza dei contratti d'evento è verificata dalla Regola 3.)
    [Fact]
    public void Dtos_should_be_pure()
    {
        var forbidden = InfrastructurePackages
            .Append("Microsoft.AspNetCore.Identity")
            .Append("Microsoft.AspNetCore")
            .ToArray();

        var result = Types.InAssembly(AppAssembly)
            .That().ResideInNamespaceEndingWith(".Dtos")
            .Should().NotHaveDependencyOnAny(forbidden)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "i DTO devono essere POCO/record puri, senza dipendenze verso infrastruttura o Identity. " +
            "Tipi che violano la regola: " + Describe(result));
    }

    // ── Regola 3 ──────────────────────────────────────────────────────────────
    // I contratti degli eventi RabbitMQ devono restare isolati dalla logica di business
    // e dall'infrastruttura.
    [Fact]
    public void Event_contracts_should_be_isolated_from_business_logic()
    {
        var result = Types.InAssembly(AppAssembly)
            .That().ResideInNamespace("AuthService.Messaging")
            .And().HaveNameEndingWith("Message")
            .Should().NotHaveDependencyOnAny(
                "AuthService.Auth",
                "AuthService.Identity",
                "AuthService.Jwt",
                "AuthService.Email",
                "AuthService.Keys",
                "MassTransit",
                "RabbitMQ",
                "Microsoft.EntityFrameworkCore")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "i contratti degli eventi devono essere DTO puri, non accoppiati alla logica di business o all'infrastruttura. " +
            "Tipi che violano la regola: " + Describe(result));
    }

    // ── Regola 4a ─────────────────────────────────────────────────────────────
    [Fact]
    public void Types_named_Controller_should_inherit_ControllerBase()
    {
        var result = Types.InAssembly(AppAssembly)
            .That().HaveNameEndingWith("Controller")
            .Should().Inherit(typeof(ControllerBase))
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "i Controller devono ereditare da ControllerBase. Tipi che violano la regola: " + Describe(result));
    }

    // ── Regola 4b ─────────────────────────────────────────────────────────────
    [Fact]
    public void Types_inheriting_ControllerBase_should_be_named_Controller()
    {
        var result = Types.InAssembly(AppAssembly)
            .That().Inherit(typeof(ControllerBase))
            .Should().HaveNameEndingWith("Controller")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "le classi che ereditano da ControllerBase devono terminare con 'Controller'. Tipi che violano la regola: " + Describe(result));
    }

    private static string Describe(TestResult result) =>
        result.FailingTypes is { } types && types.Any()
            ? string.Join(", ", types.Select(t => t.FullName))
            : "(nessuno)";
}
