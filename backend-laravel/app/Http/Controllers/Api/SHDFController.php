<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SHDFFormRequest;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Services\SHDFService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SHDFController extends Controller
{
    use AuthorizesRequests;
    public function __construct(private SHDFService $shdService) {}

    /**
     * GET /api/shdf/{student_id}
     * Retrieve SHDF for a student for the current school year.
     */
    public function show(Request $request, int $studentId): JsonResponse
    {
        $student = Student::where('student_id', $studentId)->firstOrFail();
        $this->authorize('view', $student);

        $schoolYear = SchoolYear::where('is_current', true)->firstOrFail();

        return response()->json(
            $this->shdService->getRecord($studentId, $schoolYear->id)
        );
    }

    /**
     * POST /api/shdf
     * Create or update SHDF submission.
     */
    public function store(SHDFFormRequest $request): JsonResponse
    {
        try {
            $result = $this->shdService->upsert(
                $request->validated(),
                $request->file('signature')
            );

            return response()->json($result, 200);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(
                ['message' => 'Submission failed. Please try again.'],
                500
            );
        }
    }

    /**
     * POST /api/shdf/basic
     * Submit basic info (Stage 1) - Required for QR code
     */
    public function storeBasic(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,student_id'],
            'parent_guardian_name' => ['required', 'string', 'max:150'],
            'emergency_contact' => ['required', 'string', 'max:150'],
            'emergency_contact_relation' => ['required', 'string', 'max:100'],
            'emergency_contact_phone' => ['required', 'string', 'max:20'],
            'height_cm' => ['nullable', 'numeric', 'min:0'],
            'weight_kg' => ['nullable', 'numeric', 'min:0'],
            'blood_type' => ['nullable', 'string', 'in:A+,A-,B+,B-,AB+,AB-,O+,O-'],
        ]);

        $student = Student::where('student_id', $validated['student_id'])->firstOrFail();
        $this->authorize('submit', $student);

        try {
            $result = $this->shdService->submitBasicInfo($validated);
            return response()->json($result, 200);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(
                ['message' => 'Submission failed. Please try again.', 'error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * POST /api/shdf/comprehensive
     * Submit comprehensive info (Stage 2) - Full SHDF
     */
    public function storeComprehensive(SHDFFormRequest $request): JsonResponse
    {
        try {
            $result = $this->shdService->submitComprehensive(
                $request->validated(),
                $request->file('signature')
            );

            return response()->json($result, 200);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(
                ['message' => $e->getMessage()],
                $e->getMessage() === 'Please complete basic information first.' ? 400 : 500
            );
        }
    }

    /**
     * GET /api/shdf/{student_id}/status
     * Get SHDF completion status
     */
    public function status(Request $request, int $studentId): JsonResponse
    {
        $student = Student::where('student_id', $studentId)->firstOrFail();
        $this->authorize('view', $student);

        $status = $this->shdService->getStatus($studentId);
        
        \Log::info('[SHDF Status] Student: ' . $studentId . ' | Status: ' . json_encode($status));

        return response()->json($status);
    }

    /**
     * GET /api/shdf/{student_id}/{school_year_id}
     * Retrieve SHDF for a student for a specific school year.
     */
    public function showByYear(Request $request, int $studentId, int $schoolYearId): JsonResponse
    {
        $student = Student::where('student_id', $studentId)->firstOrFail();
        $this->authorize('view', $student);

        return response()->json(
            $this->shdService->getRecord($studentId, $schoolYearId)
        );
    }
}
