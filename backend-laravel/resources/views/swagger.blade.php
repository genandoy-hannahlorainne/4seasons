<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>4seasons API Swagger</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <style>
        :root {
            color-scheme: light;
            --bg: #f5f7fb;
            --panel: #ffffff;
            --ink: #102033;
            --muted: #5f6b7a;
            --accent: #0b6ef5;
        }

        body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background:
                radial-gradient(circle at top left, rgba(11, 110, 245, 0.10), transparent 30%),
                linear-gradient(180deg, #eef3fb 0%, #f8fafc 100%);
            color: var(--ink);
        }

        .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            padding: 20px 28px;
            border-bottom: 1px solid rgba(16, 32, 51, 0.08);
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            position: sticky;
            top: 0;
            z-index: 20;
        }

        .brand {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .brand strong {
            font-size: 18px;
            letter-spacing: 0.2px;
        }

        .brand span {
            font-size: 13px;
            color: var(--muted);
        }

        .links {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .links a {
            color: var(--accent);
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
        }

        .hero {
            max-width: 1100px;
            margin: 28px auto 0;
            padding: 0 28px;
        }

        .card {
            background: var(--panel);
            border: 1px solid rgba(16, 32, 51, 0.08);
            border-radius: 20px;
            box-shadow: 0 18px 50px rgba(16, 32, 51, 0.08);
            padding: 22px 24px;
        }

        .card h1 {
            margin: 0 0 8px;
            font-size: 30px;
        }

        .card p {
            margin: 0;
            color: var(--muted);
            line-height: 1.6;
        }

        #swagger-ui {
            max-width: 1400px;
            margin: 24px auto 48px;
            padding: 0 28px 32px;
        }

        .swagger-ui .topbar {
            display: none;
        }

        @media (max-width: 768px) {
            .topbar {
                padding: 16px 18px;
                flex-direction: column;
                align-items: flex-start;
            }

            .hero,
            #swagger-ui {
                padding-left: 18px;
                padding-right: 18px;
            }

            .card h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="topbar">
        <div class="brand">
            <strong>4seasons API Documentation</strong>
            <span>Swagger UI backed by documents/openapi.yaml</span>
        </div>
        <div class="links">
            <a href="/openapi.yaml" target="_blank" rel="noreferrer">Open YAML</a>
            <a href="/api/health" target="_blank" rel="noreferrer">Health Check</a>
        </div>
    </div>

    <section class="hero">
        <div class="card">
            <h1>StudentCare+ API Explorer</h1>
            <p>
                Browse authentication, admin workflows, medical visits, SHDF, push subscriptions,
                direct FCM messaging, and Semaphore SMS integration from a single Swagger view.
            </p>
        </div>
    </section>

    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.addEventListener('load', function () {
            window.ui = SwaggerUIBundle({
                url: '/openapi.yaml',
                dom_id: '#swagger-ui',
                deepLinking: true,
                displayRequestDuration: true,
                docExpansion: 'list',
                operationsSorter: 'alpha',
                tagsSorter: 'alpha',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset,
                ],
                layout: 'BaseLayout',
            });
        });
    </script>
</body>
</html>