<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medical_history', function (Blueprint $table) {
            // Menarche (females only)
            $table->string('menarche_age', 20)->nullable()->after('notes');
            $table->string('menarche_age_other', 100)->nullable()->after('menarche_age');

            // Allergy status (yes = has allergy detail in allergies table, nka = no known allergy)
            $table->enum('allergy_status', ['yes', 'nka'])->nullable()->after('menarche_age_other');

            // Additional medical conditions not in existing schema
            $table->boolean('condition_error_of_refraction')->default(false)->after('allergy_status');
            $table->boolean('condition_anemia')->default(false)->after('condition_error_of_refraction');
            $table->boolean('condition_gastric_ulcer')->default(false)->after('condition_anemia');
            $table->boolean('condition_anxiety_depression')->default(false)->after('condition_gastric_ulcer');
            $table->boolean('condition_g6pd')->default(false)->after('condition_anxiety_depression');
            $table->boolean('condition_none')->default(false)->after('condition_g6pd');
            $table->text('condition_other_text')->nullable()->after('condition_none');

            // Medications commonly given
            $table->boolean('medications_paracetamol')->default(false)->after('condition_other_text');
            $table->boolean('medications_mefenamic')->default(false)->after('medications_paracetamol');
            $table->boolean('medications_anti_allergy')->default(false)->after('medications_mefenamic');
            $table->boolean('medications_anti_asthma')->default(false)->after('medications_anti_allergy');
            $table->boolean('medications_loperamide')->default(false)->after('medications_anti_asthma');
            $table->boolean('medications_antacids')->default(false)->after('medications_loperamide');
            $table->boolean('medications_or_solution')->default(false)->after('medications_antacids');
            $table->boolean('medications_none')->default(false)->after('medications_or_solution');
            $table->text('medications_other_text')->nullable()->after('medications_none');

            // PWD / Deformity
            $table->enum('pwd_status', ['acquired', 'congenital', 'none'])->nullable()->after('medications_other_text');
            $table->text('pwd_congenital_detail')->nullable()->after('pwd_status');

            // Surgery / Hospitalization history
            $table->boolean('surgery_history')->default(false)->after('pwd_congenital_detail');
        });
    }

    public function down(): void
    {
        Schema::table('medical_history', function (Blueprint $table) {
            $table->dropColumn([
                'menarche_age',
                'menarche_age_other',
                'allergy_status',
                'condition_error_of_refraction',
                'condition_anemia',
                'condition_gastric_ulcer',
                'condition_anxiety_depression',
                'condition_g6pd',
                'condition_none',
                'condition_other_text',
                'medications_paracetamol',
                'medications_mefenamic',
                'medications_anti_allergy',
                'medications_anti_asthma',
                'medications_loperamide',
                'medications_antacids',
                'medications_or_solution',
                'medications_none',
                'medications_other_text',
                'pwd_status',
                'pwd_congenital_detail',
                'surgery_history',
            ]);
        });
    }
};
