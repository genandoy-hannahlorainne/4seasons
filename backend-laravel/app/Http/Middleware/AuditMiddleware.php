<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AuditLog;
use Symfony\Component\HttpFoundation\Response;

class AuditMiddleware
{
    /**
     * Sensitive routes that should be audited
     */
    private array $auditableRoutes = [
        'students.show' => ['action' => 'view', 'resource' => 'Student'],
        'students.update' => ['action' => 'update', 'resource' => 'Student'],
        'shdf.show' => ['action' => 'view', 'resource' => 'SHDF'],
        'shdf.store' => ['action' => 'create', 'resource' => 'SHDF'],
        'medical-visits.show' => ['action' => 'view', 'resource' => 'MedicalVisit'],
        'medical-visits.store' => ['action' => 'create', 'resource' => 'MedicalVisit'],
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only audit successful requests
        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            $this->logIfAuditable($request);
        }

        return $response;
    }

    private function logIfAuditable(Request $request): void
    {
        $routeName = $request->route()?->getName();

        if (!$routeName || !isset($this->auditableRoutes[$routeName])) {
            return;
        }

        $config = $this->auditableRoutes[$routeName];
        $resourceId = $this->extractResourceId($request);

        AuditLog::log(
            action: $config['action'],
            resourceType: $config['resource'],
            resourceId: $resourceId,
            description: $this->buildDescription($request, $config)
        );
    }

    private function extractResourceId(Request $request): ?int
    {
        // Try to get ID from route parameters
        $params = $request->route()?->parameters() ?? [];

        foreach (['student', 'studentId', 'id', 'visit'] as $key) {
            if (!isset($params[$key])) {
                continue;
            }

            $value = $params[$key];

            // Handle route model binding (resolved to a model instance)
            if (is_object($value) && method_exists($value, 'getKey')) {
                return (int) $value->getKey();
            }

            if (is_numeric($value)) {
                return (int) $value;
            }
        }

        return null;
    }

    private function buildDescription(Request $request, array $config): string
    {
        $user = $request->user();
        $userName = $user?->full_name ?? 'Unknown';
        $role = $user?->role?->role_name ?? 'Unknown';

        return "{$userName} ({$role}) {$config['action']}d {$config['resource']}";
    }
}
