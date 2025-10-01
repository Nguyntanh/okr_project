<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\View\ViewException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        // Handle PatternSearcher errors specifically
        if ($e instanceof ViewException && 
            strpos($e->getMessage(), 'mb_ereg_search_init') !== false) {
            
            // Return a simple error page without syntax highlighting
            return response()->view('errors.500', [
                'exception' => $e,
                'message' => 'Có lỗi xảy ra trong quá trình xử lý. Vui lòng thử lại sau.'
            ], 500);
        }

        return parent::render($request, $e);
    }
}
