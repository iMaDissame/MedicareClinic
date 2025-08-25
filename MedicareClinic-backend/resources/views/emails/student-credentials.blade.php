<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vos identifiants de connexion</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f4f4f4;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 3px solid #ec4899;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ec4899;
            margin-bottom: 10px;
        }
        .welcome {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .credentials-box {
            background-color: #f8fafc;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 25px;
            margin: 25px 0;
        }
        .credential-item {
            margin: 15px 0;
            display: flex;
            align-items: center;
        }
        .credential-label {
            font-weight: bold;
            color: #374151;
            min-width: 140px;
        }
        .credential-value {
            background-color: #ffffff;
            padding: 10px 15px;
            border: 1px solid #d1d5db;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            color: #1f2937;
            flex: 1;
            margin-left: 10px;
        }
        .login-button {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899, #f472b6);
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
        }
        .login-button:hover {
            background: linear-gradient(135deg, #db2777, #ec4899);
        }
        .instructions {
            background-color: #fdf2f8;
            border-left: 4px solid #ec4899;
            padding: 20px;
            margin: 25px 0;
        }
        .instructions h3 {
            color: #be185d;
            margin-top: 0;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .security-note strong {
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ asset('MDClogo.png') }}" alt="Medicare Clinic Logo" style="max-width: 200px; height: auto; margin-bottom: 15px;">
            <div class="logo">Medicare Clinic</div>
            <p style="color: #6b7280; margin: 0;">Plateforme de Formation Médicale</p>
        </div>

        <h1 class="welcome">Bienvenue {{ $user->name ?? $user->username }} !</h1>

        <p>Nous avons le plaisir de vous informer que votre compte étudiant a été créé avec succès sur la plateforme Medicare Clinic.</p>

        <div class="credentials-box">
            <h3 style="margin-top: 0; color: #1f2937;">🔐 Vos identifiants de connexion :</h3>

            <div class="credential-item">
                <span class="credential-label">Nom d'utilisateur :</span>
                <span class="credential-value">{{ $user->username }}</span>
            </div>

            <div class="credential-item">
                <span class="credential-label">Mot de passe :</span>
                <span class="credential-value">{{ $password }}</span>
            </div>
        </div>

        <div class="security-note">
            <strong>🔒 Important - Sécurité :</strong><br>
            Pour votre sécurité, vous devrez <strong>obligatoirement modifier votre mot de passe</strong> lors de votre première connexion. Cette mesure garantit la protection de votre compte et de vos données personnelles.
        </div>

        <div class="instructions">
            <h3>📚 Comment accéder à votre formation :</h3>
            <ol>
                <li>Cliquez sur le bouton de connexion ci-dessous</li>
                <li>Utilisez votre nom d'utilisateur et votre mot de passe temporaire</li>
                <li><strong>Modifiez immédiatement votre mot de passe</strong> (obligatoire pour des raisons de sécurité)</li>
                <li>Accédez à vos cours et ressources de formation</li>
            </ol>
        </div>

        <div style="text-align: center;">
            <a href="{{ $loginUrl }}" class="login-button">🚀 Se connecter à Medicare Clinic</a>
        </div>

        @if($user->access_start && $user->access_end)
        <div style="background-color: #fdf2f8; border: 1px solid #ec4899; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <strong style="color: #be185d;">📅 Période d'accès :</strong><br>
            Du {{ \Carbon\Carbon::parse($user->access_start)->format('d/m/Y') }}
            au {{ \Carbon\Carbon::parse($user->access_end)->format('d/m/Y') }}
        </div>
        @endif

        <div class="footer">
            <p><strong>Besoin d'aide ?</strong></p>
            <p>Si vous rencontrez des difficultés pour vous connecter, n'hésitez pas à contacter notre équipe support.</p>
            <p style="margin-top: 20px;">
                <em>© {{ date('Y') }} Medicare Clinic - Plateforme de Formation Médicale</em>
            </p>
        </div>
    </div>
</body>
</html>
