<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UicNumber implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string, ?string=): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $cleanUIC = preg_replace('/[^0-9]/', '', (string)$value);
        if (strlen($cleanUIC) != 12) {
            $fail('A(z) :attribute pontosan 12 számjegyből kell álljon (ellenőrzőszámmal együtt).');
        }

        $sum = 0;
        for ($i = 0; $i < 11; $i++) {
            $digit = (int)$cleanUIC[$i];

            $multiplier = ($i % 2 == 0) ? 2 : 1;
            $product = $digit * $multiplier;

            if ($product > 9) {
                $product -= 9;
            }
            $sum += $product;
        }

        $expectedCheckDigit = (10 - ($sum % 10)) % 10;
        $actualCheckDigit = (int)$cleanUIC[11];

        if ($expectedCheckDigit !== $actualCheckDigit) {
            $fail('A megadott pályaszám érvénytelen! Az ellenőrzőszámnak ' . $expectedCheckDigit . '-nak/-nek kellene lennie.');
        }
    }
}
