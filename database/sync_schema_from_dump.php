<?php

/**
 * Safe schema sync from database/4seasons.sql
 * - Creates only missing tables
 * - Applies ALTER TABLE blocks for newly-created tables
 * - Seeds essential lookup data (roles, grade_levels) only when empty
 */

$host = 'localhost';
$dbName = '4seasons';
$username = 'root';
$password = '';
$dumpPath = __DIR__ . '/4seasons.sql';

function info(string $message): void {
    echo "[INFO] {$message}\n";
}

function warn(string $message): void {
    echo "[WARN] {$message}\n";
}

function err(string $message): void {
    echo "[ERROR] {$message}\n";
}

try {
    if (!file_exists($dumpPath)) {
        throw new RuntimeException("SQL dump not found: {$dumpPath}");
    }

    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbName};charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    $dumpSql = file_get_contents($dumpPath);
    if ($dumpSql === false) {
        throw new RuntimeException('Failed to read SQL dump file.');
    }

    preg_match_all('/CREATE TABLE `([^`]+)` \((?:.|\n)*?\) ENGINE=.*?;/', $dumpSql, $createMatches, PREG_SET_ORDER);
    preg_match_all('/ALTER TABLE `([^`]+)`(?:.|\n)*?;/', $dumpSql, $alterMatches, PREG_SET_ORDER);

    $createByTable = [];
    foreach ($createMatches as $match) {
        $table = $match[1];
        $sql = preg_replace('/^CREATE TABLE /', 'CREATE TABLE IF NOT EXISTS ', $match[0], 1);
        $createByTable[$table] = $sql;
    }

    $alterByTable = [];
    foreach ($alterMatches as $match) {
        $table = $match[1];
        if (!isset($alterByTable[$table])) {
            $alterByTable[$table] = [];
        }
        $alterByTable[$table][] = $match[0];
    }

    if (empty($createByTable)) {
        throw new RuntimeException('No CREATE TABLE statements found in dump.');
    }

    $existingTablesStmt = $pdo->query('SHOW TABLES');
    $existingTablesRaw = $existingTablesStmt->fetchAll(PDO::FETCH_NUM);
    $existingTables = [];
    foreach ($existingTablesRaw as $row) {
        $existingTables[$row[0]] = true;
    }

    $createdTables = [];
    $skippedTables = [];
    $failedTables = [];

    foreach ($createByTable as $table => $createSql) {
        if (isset($existingTables[$table])) {
            $skippedTables[] = $table;
            continue;
        }

        try {
            $pdo->exec($createSql);
            $createdTables[] = $table;
            info("Created table: {$table}");
        } catch (Throwable $e) {
            $failedTables[] = $table;
            err("Failed creating {$table}: " . $e->getMessage());
        }
    }

    $alterApplied = 0;
    foreach ($createdTables as $table) {
        if (empty($alterByTable[$table])) {
            continue;
        }

        foreach ($alterByTable[$table] as $alterSql) {
            try {
                $pdo->exec($alterSql);
                $alterApplied++;
            } catch (Throwable $e) {
                warn("ALTER failed for {$table}: " . $e->getMessage());
            }
        }
    }

    $seedTables = ['roles', 'grade_levels'];
    foreach ($seedTables as $seedTable) {
        if (!isset($createByTable[$seedTable])) {
            continue;
        }

        try {
            $countStmt = $pdo->query("SELECT COUNT(*) AS total FROM `{$seedTable}`");
            $count = (int)($countStmt->fetch()['total'] ?? 0);
            if ($count > 0) {
                continue;
            }

            if (preg_match('/INSERT INTO `' . preg_quote($seedTable, '/') . '`(?:.|\n)*?;/', $dumpSql, $insertMatch)) {
                $pdo->exec($insertMatch[0]);
                info("Seeded table: {$seedTable}");
            }
        } catch (Throwable $e) {
            warn("Seeding failed for {$seedTable}: " . $e->getMessage());
        }
    }

    info('Schema sync completed.');
    info('Created tables: ' . count($createdTables));
    info('Skipped existing tables: ' . count($skippedTables));
    info('Failed tables: ' . count($failedTables));
    info('ALTER statements applied: ' . $alterApplied);

    if (!empty($failedTables)) {
        warn('Tables with create failures: ' . implode(', ', $failedTables));
    }

} catch (Throwable $e) {
    err($e->getMessage());
    exit(1);
}
