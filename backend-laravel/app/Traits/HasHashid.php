<?php

namespace App\Traits;

use App\Services\HashidService;

trait HasHashid
{
    /**
     * Get the hashed ID for this model
     */
    public function getHashidAttribute(): string
    {
        $service = app(HashidService::class);
        return $service->encode($this->getKey());
    }

    /**
     * Find a model by its hashed ID
     */
    public static function findByHashid(string $hashid): ?self
    {
        $service = app(HashidService::class);
        $id = $service->decode($hashid);

        if ($id === null) {
            return null;
        }

        return static::find($id);
    }

    /**
     * Find a model by its hashed ID or fail
     */
    public static function findByHashidOrFail(string $hashid): self
    {
        $model = static::findByHashid($hashid);

        if ($model === null) {
            throw new \Illuminate\Database\Eloquent\ModelNotFoundException(
                'No query results for model [' . static::class . '] with hashid: ' . $hashid
            );
        }

        return $model;
    }
}
