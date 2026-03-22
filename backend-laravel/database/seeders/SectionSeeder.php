<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class SectionSeeder extends Seeder
{
    public function run(): void
    {
        $schoolYearId = DB::table('school_years')->where('is_current', true)->value('id');

        // Create current school year if it doesn't exist yet
        if (!$schoolYearId) {
            $schoolYearId = DB::table('school_years')->insertGetId([
                'year_name'  => '2025-2026',
                'start_date' => '2025-06-01',
                'end_date'   => '2026-03-31',
                'is_current' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $this->command->info('SectionSeeder: Created default school year 2025-2026.');
        }

        $defaultPassword = Hash::make('pdmhs@2026');
        $adviserRoleId   = DB::table('roles')->where('role_name', 'Adviser')->value('role_id');

        // [grade_level_number, section_number, section_name, adviser_full_name]
        $sections = [
            // Grade 7
            [7,  1, 'Genesis',      'RENAVIL J. SARIL'],
            [7,  2, 'Isaiah',       'MAGDALENA B. OCADO'],
            [7,  3, 'James',        'MAY M. IRENEA'],
            [7,  4, 'Jeremiah',     'GEMMA S. CARANGIAN'],
            [7,  5, 'Jude',         'LEA S. RESTA'],
            [7,  6, 'King',         'CHERRY Q. LOZANTA'],
            [7,  7, 'Leviticus',    'MELANIE M. VALEZA'],
            [7,  8, 'Luke',         'RHAY JHON S. DECIPULO'],
            [7,  9, 'Mark',         'CRESENCIANO G. LIWAGON JR.'],
            [7, 10, 'Matthew',      'JAYVEE O. BASTASA'],
            [7, 11, 'Philippians',  'RUSSEL JOHN S. AMBROCIO'],
            [7, 12, 'Samuel',       'DERICK G. DATUL'],
            [7, 13, 'Solomon',      'CRISTY M. SARMIENTO'],
            [7, 14, 'OHSP',         'EVELYN V. ODTUJAN'],
            // Grade 8
            [8,  1, 'Charity',      'MARISSA M. TUSCANO'],
            [8,  2, 'Courage',      'ELVIRA T. ESMIN'],
            [8,  3, 'Kindness',     'LOVELYN M. TESALONA'],
            [8,  4, 'Love',         'CRISTY S. CONOPIO'],
            [8,  5, 'Faith',        'JENIFER O. TOSCO'],
            [8,  6, 'Forgiveness',  'MARIZ D. UNTALAN'],
            [8,  7, 'Fortitude',    'RAMON F. MAMARLAO'],
            [8,  8, 'Generosity',   'RUSSEL JOHN S. AMBROCIO'],
            [8,  9, 'Gratitude',    'MARY-ANN B. MENOR'],
            [8, 10, 'Honesty',      'MYRA G. GENAVIA'],
            [8, 11, 'Hope',         'DONALYN E. MARCELINO'],
            [8, 12, 'Prudence',     'JEANYLYN M. LAGASON'],
            [8, 13, 'Wisdom',       'RAMON L. GERSIN JR.'],
            [8, 14, 'Humility',     'BENILDA T. ARAZAS'],
            [8, 15, 'Justine OHSP', 'MONDESSA NERRIE P. ROSENTO'],
            // Grade 9
            [9,  1, 'Avogadro',    'ERNEST MARK M. BELTRAN'],
            [9,  2, 'Boyle',       'LORENA D. DATUL'],
            [9,  3, 'Brown',       'ELY B. MIRANDILLA'],
            [9,  4, 'Chadwick',    'REYLYN L. GUMABAY'],
            [9,  5, 'Darwin',      'JOEL C. LOPEZ'],
            [9,  6, 'Democritus',  'VICKY S. TIWANG'],
            [9,  7, 'Fleming',     'REINALYN J. GANAN'],
            [9,  8, 'Graham',      'MICHELLE ANGELA G. PORNEA'],
            [9,  9, 'Mendelev',    'EVANGELINE T. BANGAYAN'],
            [9, 10, 'Priestly',    'ANIELYN A. BALUYO'],
            [9, 11, 'Pasteur',     'MARY GRACE M. REOTIRAS'],
            [9, 12, 'Sommerfield', 'BENILDA T. ARAZAS'],
            // Grade 10
            [10,  1, 'Chrysanthemum', 'NARIZA JANE B. TAMUNDONG'],
            [10,  2, 'Anthurium',     'CARCILI R. DACUMOS'],
            [10,  3, 'Aster',         'RHODA JANE D. AURESTILA'],
            [10,  4, 'Camia',         'JHONY C. OMBID'],
            [10,  5, 'Carnation',     'MARLYN R. ABONITA'],
            [10,  6, 'Daffodil',      'JESSIE A. SALAZAR'],
            [10,  7, 'Gumamela',      'FLAIR A. MACALANDA'],
            [10,  8, 'Hyacinth',      'JONALYN P. SANTUYO'],
            [10,  9, 'Lily',          'ANALYN V. ONGJANGCO'],
            [10, 10, 'Lotus',         'RUTH B. PERIDO'],
            [10, 11, 'Orchid',        'NOVIELYN L. CARBERO'],
            [10, 12, 'Tulip',         'MARIA RICA L. ANTONIO'],
            [10, 13, 'Zinnia',        'MYLENE R. CABATBAT'],
            // Grade 11
            [11,  1, 'Rockefeller', 'ARNIE D. CANDELARIA'],
            [11,  2, 'Osler',       'MARK PAUL V. GONZAGA'],
            [11,  3, 'Fermat',      'MERLY V. JATANILLA'],
            [11,  4, 'Pythagoras',  'LORY MAE C. ALCOSABA'],
            [11,  5, 'Voltaire',    'FRENIE M. UBINA'],
            [11,  6, 'Herodotus',   'KRISTINE PEARL M. NOLLEDO'],
            [11,  7, 'Hemingway',   'MERELYN M. MAISA'],
            [11,  8, 'Keller',      'EDYLYN M. MODEQUILLO'],
            [11,  9, 'Sy',          'ABEGAIL B. SARIO-MARTICIO'],
            [11, 10, 'Zobel',       'CRISTINE C. CAPILA'],
            [11, 11, 'Jobs',        'EMMILY R. VILLAVERDE'],
            [11, 12, 'Gates',       'ANNA LYN L. AYERAS'],
            [11, 13, 'Aristocrat',  'CHELZY MAE D. GUTIERREZ-SISON'],
            [11, 14, 'Gueverra',    'JENNY S. SENCIL'],
            [11, 15, 'Empere',      'EVEA A. CASTOR'],
            [11, 16, 'Pfizer',      'ROCEL M. MOSCAYA'],
            [11, 17, 'Crisostomo',  'MARK PAUL V. GONZAGA'],
            // Grade 12
            [12,  1, 'Gold',       'ROMEO B. LUCERO JR.'],
            [12,  2, 'Scandium',   'ALDRIN M. CORTEZ'],
            [12,  3, 'Silver',     'JOHN RAY E. MENDOZA'],
            [12,  4, 'Yttrium',    'WARREN E. CASTUDES'],
            [12,  5, 'Copper',     'JAY EDWARD A. ABONALLA'],
            [12,  6, 'Mercury',    'ALDRINE E. REGALA'],
            [12,  7, 'Palladium',  'LEILANI D. CONCEPCION'],
            [12,  8, 'Vanadium',   'AIZEYAH B. IBAÑEZ'],
            [12,  9, 'Rhodium',    'MARK PAUL V. GONZAGA'],
            [12, 10, 'Bronze',     'MA. ELISA N. NOSERALE'],
            [12, 11, 'Manganese',  'JESSIE GRACE C. DE LUNA'],
            [12, 12, 'Nickel',     'ALLAN B. GARGANIAN'],
            [12, 13, 'Zirconium',  'IVY B. PADUA'],
            [12, 14, 'Platinum',   'JOHN LOWELL O. REGALARIO'],
            [12, 15, 'Titanium',   'JAY F. NEPUCPAN'],
        ];

        $gradeLevelIds  = DB::table('grade_levels')->pluck('id', 'level_number');
        $adviserUserIds = [];
        $adviserCount   = 0;
        $sectionCount   = 0;

        foreach ($sections as [$grade, $sectionNum, $sectionName, $adviserName]) {
            // --- Adviser: create only if not already in DB ---
            if (!isset($adviserUserIds[$adviserName])) {
                $existing = DB::table('users')
                    ->where('full_name', $adviserName)
                    ->where('role_id', $adviserRoleId)
                    ->first();

                if ($existing) {
                    $adviserUserIds[$adviserName] = $existing->user_id;
                } else {
                    // Build username from name
                    $parts     = explode(' ', $adviserName);
                    $nameParts = array_values(array_filter($parts, fn($p) => !preg_match('/^(JR\.|SR\.|III|II)$/i', $p)));
                    $firstName = $nameParts[0];
                    $lastName  = strtolower(end($nameParts));
                    $username  = strtolower(substr($firstName, 0, 1)) . '.' . $lastName;

                    $base = $username;
                    $i    = 1;
                    while (DB::table('users')->where('username', $username)->exists()) {
                        $username = $base . $i++;
                    }

                    $nextId = (DB::table('users')->max('user_id') ?? 0) + 1;

                    DB::table('users')->insert([
                        'user_id'              => $nextId,
                        'role_id'              => $adviserRoleId,
                        'username'             => $username,
                        'password_hash'        => $defaultPassword,
                        'email'                => $username . '@pdmhs.edu.ph',
                        'full_name'            => $adviserName,
                        'password_must_change' => true,
                        'is_active'            => true,
                        'created_at'           => now(),
                    ]);

                    $userId = $nextId;

                    $nextAdviserId = (DB::table('advisers')->max('adviser_id') ?? 0) + 1;

                    DB::table('advisers')->insert([
                        'adviser_id'  => $nextAdviserId,
                        'user_id'     => $userId,
                        'employee_id' => 'EMP-' . str_pad($userId, 4, '0', STR_PAD_LEFT),
                        'is_active'   => true,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);

                    $adviserUserIds[$adviserName] = $userId;
                    $adviserCount++;
                }
            }

            // --- Section: insert only if not already present ---
            $gradeLevelId = $gradeLevelIds[$grade] ?? null;
            if (!$gradeLevelId) continue;

            $exists = DB::table('sections')
                ->where('grade_level_id', $gradeLevelId)
                ->where('section_number', $sectionNum)
                ->where('school_year_id', $schoolYearId)
                ->exists();

            if (!$exists) {
                DB::table('sections')->insert([
                    'section_name'       => $sectionName,
                    'section_number'     => $sectionNum,
                    'grade_level_id'     => $gradeLevelId,
                    'school_year_id'     => $schoolYearId,
                    'adviser_id'         => $adviserUserIds[$adviserName] ?? null,
                    'capacity'           => 50,
                    'current_enrollment' => 0,
                    'is_active'          => true,
                    'created_at'         => now(),
                ]);
                $sectionCount++;
            }
        }

        $this->command->info("SectionSeeder: {$adviserCount} new advisers and {$sectionCount} new sections created.");
    }
}
