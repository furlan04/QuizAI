using System.Security.Cryptography;
using System.Text;

namespace AuthService.Keys;

public class RsaKeyProvider
{
    private readonly RSA _privateKey;
    private readonly RSA _publicKey;
    private readonly string _kid;

    public RsaKeyProvider(IConfiguration config)
    {
        var privateEnv = config["RSA_PRIVATE_KEY"];
        var publicEnv  = config["RSA_PUBLIC_KEY"];

        if (!string.IsNullOrWhiteSpace(privateEnv) && !string.IsNullOrWhiteSpace(publicEnv))
        {
            (_privateKey, _publicKey) = LoadFromEnv(privateEnv, publicEnv);
        }
        else
        {
            (_privateKey, _publicKey) = LoadOrGenerateFiles();
        }

        _kid = ComputeKid(_publicKey);
    }

    public RSA     PrivateKey      => _privateKey;
    public RSA     PublicKey       => _publicKey;
    public string  Kid             => _kid;

    // ── private helpers ───────────────────────────────────────────────────────

    private static (RSA priv, RSA pub) LoadFromEnv(string privateB64, string publicB64)
    {
        var privatePem = Encoding.UTF8.GetString(Convert.FromBase64String(privateB64));
        var publicPem  = Encoding.UTF8.GetString(Convert.FromBase64String(publicB64));

        var priv = RSA.Create();
        priv.ImportFromPem(privatePem);

        var pub = RSA.Create();
        pub.ImportFromPem(publicPem);

        return (priv, pub);
    }

    private static (RSA priv, RSA pub) LoadOrGenerateFiles()
    {
        var keysDir        = Path.Combine(Directory.GetCurrentDirectory(), "keys");
        var privateKeyPath = Path.Combine(keysDir, "private.pem");
        var publicKeyPath  = Path.Combine(keysDir, "public.pem");

        Directory.CreateDirectory(keysDir);

        if (File.Exists(privateKeyPath) && File.Exists(publicKeyPath))
        {
            var priv = RSA.Create();
            priv.ImportFromPem(File.ReadAllText(privateKeyPath));

            var pub = RSA.Create();
            pub.ImportFromPem(File.ReadAllText(publicKeyPath));

            return (priv, pub);
        }

        // Generate new 2048-bit RSA pair
        var generated = RSA.Create(2048);

        var newPub = RSA.Create();
        newPub.ImportRSAPublicKey(generated.ExportRSAPublicKey(), out _);

        File.WriteAllText(privateKeyPath, generated.ExportPkcs8PrivateKeyPem());
        File.WriteAllText(publicKeyPath,  newPub.ExportSubjectPublicKeyInfoPem());

        return (generated, newPub);
    }

    private static string ComputeKid(RSA publicKey)
    {
        var bytes = publicKey.ExportSubjectPublicKeyInfo();
        var hash  = SHA256.HashData(bytes);
        return Convert.ToHexString(hash)[..16].ToLowerInvariant();
    }
}
