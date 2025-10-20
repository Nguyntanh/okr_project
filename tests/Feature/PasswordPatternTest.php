<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Rules\StrongPassword;
use Illuminate\Support\Facades\Validator;

class PasswordPatternTest extends TestCase
{
    public function test_password_with_common_patterns_now_allowed()
    {
        $rule = new StrongPassword();

        // Test passwords that previously failed due to common patterns
        $testPasswords = [
            'Admin123!',
            'Password123!',
            'User123!',
            'AdminPass123!',
            'PasswordAdmin123!',
        ];

        foreach ($testPasswords as $password) {
            $validator = Validator::make(['password' => $password], [
                'password' => [$rule]
            ]);
            
            $this->assertFalse($validator->fails(), 
                "Password '{$password}' should now be allowed (no common pattern validation)");
        }
    }

    public function test_password_still_validates_other_rules()
    {
        $rule = new StrongPassword();

        // Test that other validation rules still work
        $testCases = [
            ['password' => 'weak', 'should_fail' => true, 'reason' => 'too short'],
            ['password' => 'WEAKPASS', 'should_fail' => true, 'reason' => 'no lowercase'],
            ['password' => 'weakpass', 'should_fail' => true, 'reason' => 'no uppercase'],
            ['password' => 'WeakPass', 'should_fail' => true, 'reason' => 'no numbers'],
            ['password' => 'WeakPass123', 'should_fail' => true, 'reason' => 'no special chars'],
            ['password' => 'Weak Pass123!', 'should_fail' => true, 'reason' => 'contains spaces'],
            ['password' => 'WeakPass123!', 'should_fail' => false, 'reason' => 'valid password'],
        ];

        foreach ($testCases as $case) {
            $validator = Validator::make(['password' => $case['password']], [
                'password' => [$rule]
            ]);
            
            if ($case['should_fail']) {
                $this->assertTrue($validator->fails(), 
                    "Password '{$case['password']}' should fail: {$case['reason']}");
            } else {
                $this->assertFalse($validator->fails(), 
                    "Password '{$case['password']}' should pass: {$case['reason']}");
            }
        }
    }
}
