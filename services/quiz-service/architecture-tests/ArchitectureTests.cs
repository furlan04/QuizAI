using System.Reflection;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using NetArchTest.Rules;
using Xunit;

namespace QuizService.Architecture.Tests;

/// <summary>
/// Test di architettura per quiz-service (struttura a vertical slice, progetto unico).
/// I "layer" sono identificati dai namespace:
///   - Presentation:   *Controller
///   - Application:     interfacce/servizi (es. IQuizRepository, ISessionService)
///   - Domain:          QuizService.*.Models  (entità / value object)
///   - Infrastructure:  pacchetti MongoDB / MassTransit-RabbitMQ + implementazioni concrete
///   - Event contracts: QuizService.Messaging.Messages
/// </summary>
public class ArchitectureTests
{
    private static readonly Assembly AppAssembly = typeof(QuizService.Quizzes.QuizzesController).Assembly;

    // Pacchetti/namespace che rappresentano l'infrastruttura (DB e broker di messaggi).
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
    // I Controller (Presentation) NON devono dipendere direttamente da Infrastruttura
    // (MongoDB) o dai pacchetti RabbitMQ/MassTransit. Devono passare per l'Application
    // Layer (interfacce/servizi), che non espongono tipi di infrastruttura.
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
    // Il Domain Layer (entità, value object in *.Models) deve essere puro: nessuna
    // dipendenza verso infrastruttura, web (ASP.NET) o messaging.
    [Fact]
    public void Domain_models_should_be_pure()
    {
        var forbidden = InfrastructurePackages
            .Concat(new[] { "Microsoft.AspNetCore", "QuizService.Messaging" })
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
    // I contratti degli eventi RabbitMQ (Messaging.Messages) devono restare isolati:
    // niente accoppiamento con la logica di business interna né con l'infrastruttura.
    [Fact]
    public void Event_contracts_should_be_isolated_from_business_logic()
    {
        var result = Types.InAssembly(AppAssembly)
            .That().ResideInNamespace("QuizService.Messaging.Messages")
            .Should().NotHaveDependencyOnAny(
                "QuizService.Quizzes",
                "QuizService.Sessions",
                "QuizService.Users",
                "QuizService.Leaderboard",
                "MongoDB",
                "MassTransit",
                "RabbitMQ")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(
            "i contratti degli eventi devono essere DTO puri e condivisi, non accoppiati alla logica di business o all'infrastruttura. " +
            "Tipi che violano la regola: " + Describe(result));
    }

    // ── Regola 4a ─────────────────────────────────────────────────────────────
    // Ogni classe il cui nome termina con 'Controller' deve ereditare da ControllerBase.
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
    // Ogni classe che eredita da ControllerBase deve avere il suffisso 'Controller'.
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
