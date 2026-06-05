using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NetArchTest.Rules;
using Xunit;

namespace UserService.Architecture.Tests;

/// <summary>
/// Test di architettura per user-service (struttura a vertical slice, progetto unico).
/// I "layer" sono identificati dai namespace:
///   - Presentation:   *Controller
///   - Application:     interfacce/servizi (es. IUserRepository, IChallengeService)
///   - Domain:          UserService.*.Models  (entità / value object)
///   - Infrastructure:  pacchetti MongoDB / MassTransit-RabbitMQ + implementazioni concrete
///   - Event contracts: UserService.Messaging.Messages
/// </summary>
public class ArchitectureTests
{
    private static readonly Assembly AppAssembly = typeof(UserService.Users.UsersController).Assembly;

    private static readonly string[] InfrastructurePackages =
    {
        "MongoDB",
        "MassTransit",
        "RabbitMQ",
        "Microsoft.EntityFrameworkCore",
        "Pomelo",
        "MySql",
        "MySqlConnector",
    };

    // ── Regola 1 ──────────────────────────────────────────────────────────────
    [Fact]
    public void Controllers_should_not_depend_on_infrastructure_or_messaging_packages()
    {
        var result = Types.InAssembly(AppAssembly)
            .That().HaveNameEndingWith("Controller")
            .Should().NotHaveDependencyOnAny(InfrastructurePackages)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "i Controller devono comunicare solo tramite l'Application Layer, non con DB/RabbitMQ. " +
            "Tipi che violano la regola: " + Describe(result));
    }

    // ── Regola 2 ──────────────────────────────────────────────────────────────
    [Fact]
    public void Domain_models_should_be_pure()
    {
        var forbidden = InfrastructurePackages
            .Concat(new[] { "Microsoft.AspNetCore", "UserService.Messaging" })
            .ToArray();

        var result = Types.InAssembly(AppAssembly)
            .That().ResideInNamespaceEndingWith(".Models")
            .Should().NotHaveDependencyOnAny(forbidden)
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "le entità di dominio devono essere POCO puri (nessun attributo/dipendenza verso layer esterni). " +
            "Tipi che violano la regola: " + Describe(result));
    }

    // ── Regola 3 ──────────────────────────────────────────────────────────────
    [Fact]
    public void Event_contracts_should_be_isolated_from_business_logic()
    {
        var result = Types.InAssembly(AppAssembly)
            .That().ResideInNamespace("UserService.Messaging.Messages")
            .Should().NotHaveDependencyOnAny(
                "UserService.Challenges",
                "UserService.Friendships",
                "UserService.Users",
                "MongoDB",
                "MassTransit",
                "RabbitMQ")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "i contratti degli eventi devono essere DTO puri e condivisi, non accoppiati alla logica di business o all'infrastruttura. " +
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
