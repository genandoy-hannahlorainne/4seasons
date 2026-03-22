<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    protected $table = 'system_settings';
    protected $fillable = ['section', 'key', 'value', 'type'];

    /**
     * Get all settings grouped by section.
     */
    public static function getAllGrouped(): array
    {
        $rows = Cache::remember('system_settings', 300, fn() => self::all());

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row->section][$row->key] = self::castValue($row->value, $row->type);
        }
        return $grouped;
    }

    /**
     * Get a single setting value.
     */
    public static function get(string $section, string $key, mixed $default = null): mixed
    {
        $row = self::where('section', $section)->where('key', $key)->first();
        if (!$row) return $default;
        return self::castValue($row->value, $row->type);
    }

    /**
     * Set a single setting value.
     */
    public static function set(string $section, string $key, mixed $value): void
    {
        self::updateOrCreate(
            ['section' => $section, 'key' => $key],
            ['value' => (string) $value]
        );
        Cache::forget('system_settings');
    }

    /**
     * Save an entire section from a key=>value array.
     */
    public static function saveSection(string $section, array $values): void
    {
        foreach ($values as $key => $value) {
            self::updateOrCreate(
                ['section' => $section, 'key' => $key],
                ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]
            );
        }
        Cache::forget('system_settings');
    }

    private static function castValue(mixed $value, string $type): mixed
    {
        return match ($type) {
            'boolean' => (bool)(int) $value,
            'integer' => (int) $value,
            'json'    => json_decode($value, true),
            default   => $value,
        };
    }
}
