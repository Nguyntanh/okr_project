@extends('layouts.tailwind')

@section('title', 'Create Objective')

@section('content')
<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
            <div class="flex items-center space-x-3 mb-4">
                <div class="p-2 bg-blue-100 rounded-lg">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Create New Objective</h1>
                    <p class="text-gray-600 mt-1">Set a clear, measurable objective for your team</p>
                </div>
            </div>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <!-- Form Header -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h2 class="text-xl font-semibold text-white">Objective Details</h2>
                <p class="text-blue-100 mt-1">Fill in the information below to create your objective</p>
            </div>

            <div class="p-8">
                @if ($errors->any())
                    <div class="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-lg mb-8">
                        <div class="flex">
                            <svg class="w-5 h-5 mr-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            <div>
                                <h4 class="font-medium text-red-800">Please fix the following errors:</h4>
                                <ul class="list-disc list-inside mt-2 text-red-700">
                                    @foreach ($errors->all() as $error)
                                        <li>{{ $error }}</li>
                                    @endforeach
                                </ul>
                            </div>
                        </div>
                    </div>
                @endif

                <form action="{{ route('objectives.store') }}" method="POST" class="space-y-8">
                    @csrf
                    <input type="hidden" name="cycle_id" value="{{ $cycle_id }}">

                    <!-- Objective Title -->
                    <div class="space-y-3">
                        <label for="obj_title" class="block text-sm font-semibold text-gray-700">
                            Objective Title <span class="text-red-500">*</span>
                        </label>
                        <div class="relative">
                            <input type="text" 
                                   id="obj_title" 
                                   name="obj_title" 
                                   value="{{ old('obj_title') }}"
                                   class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 @error('obj_title') border-red-300 focus:ring-red-100 focus:border-red-500 @enderror"
                                   placeholder="e.g., Increase quarterly revenue by 25%"
                                   required>
                            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                        </div>
                        @error('obj_title')
                            <p class="text-sm text-red-600 flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Description -->
                    <div class="space-y-3">
                        <label for="description" class="block text-sm font-semibold text-gray-700">
                            Description
                        </label>
                        <textarea id="description" 
                                  name="description" 
                                  rows="4"
                                  class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 resize-none @error('description') border-red-300 focus:ring-red-100 focus:border-red-500 @enderror"
                                  placeholder="Provide more context about this objective...">{{ old('description') }}</textarea>
                        @error('description')
                            <p class="text-sm text-red-600 flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Chọn level cho OKR -->
                    <div class="sm:col-span-3">
                        <label for="level" class="block text-sm/6 font-medium text-gray-900">Cấp OKR</label>
                        <div class="mt-2 grid grid-cols-1">
                            <select id="level" name="level" autocomplete="level-name" class="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                <option>Công ty</option>
                                <option>Phòng ban</option>
                                <option>Nhóm</option>
                                <option>Cá nhân</option>
                            </select>
                            <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 ml-auto mr-2 h-4 w-4 self-center text-gray-500">
                                <path fill-rule="evenodd" d="M12.53 5.47a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06L7.5 9.44l3.97-3.97a.75.75 0 0 1 1.06 0Z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    </div>

                    <!-- Status -->
                    <div class="space-y-3">
                        <label for="status" class="block text-sm font-semibold text-gray-700">
                            Status <span class="text-red-500">*</span>
                        </label>
                        <select id="status" name="status" class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 @error('status') border-red-300 focus:ring-red-100 focus:border-red-500 @enderror" required>
                            <option value="draft" {{ old('status') == 'draft' ? 'selected' : '' }}>Draft</option>
                            <option value="active" {{ old('status') == 'active' ? 'selected' : '' }}>Active</option>
                            <option value="completed" {{ old('status') == 'completed' ? 'selected' : '' }}>Completed</option>
                        </select>
                        @error('status')
                            <p class="text-sm text-red-600 flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Progress Percent -->
                    <div class="space-y-3">
                        <label for="progress_percent" class="block text-sm font-semibold text-gray-700">
                            Progress Percent
                        </label>
                        <input type="number" 
                               id="progress_percent" 
                               name="progress_percent" 
                               value="{{ old('progress_percent', 0) }}"
                               min="0" max="100" step="1"
                               class="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 @error('progress_percent') border-red-300 focus:ring-red-100 focus:border-red-500 @enderror"
                               placeholder="0">
                        @error('progress_percent')
                            <p class="text-sm text-red-600 flex items-center">
                                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                </svg>
                                {{ $message }}
                            </p>
                        @enderror
                    </div>

                    <!-- Key Results -->
                    <div class="space-y-6">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-semibold text-gray-900">Key Results</h2>
                            <button type="button" id="add-key-result" 
                                    class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all duration-200">
                                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                                </svg>
                                Add Key Result
                            </button>
                        </div>

                        <div id="key-results-container" class="space-y-6"></div>
                    </div>

                    <!-- Submit Button -->
                    <div class="flex justify-end space-x-4 mt-8">
                        <a href="{{ route('objectives.index') }}" 
                           class="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium">
                            Cancel
                        </a>
                        <button type="submit" 
                                class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg">
                            Create Objective
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Key Result Template -->
<script>
let keyResultCount = 0;

const keyResultTemplate = `
    <div class="key-result-item space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center space-x-3">
                <div class="p-2 bg-green-100 rounded-lg">
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h4 class="font-semibold text-gray-900">Key Result <span class="key-result-number text-green-600"></span></h4>
            </div>
            <button type="button" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 remove-key-result">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Title</label>
                <input type="text" 
                       name="key_results[INDEX][kr_title]" 
                       class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                       placeholder="e.g., Achieve 15% increase in customer acquisition">
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Target Value</label>
                <input type="number" 
                       name="key_results[INDEX][target_value]" 
                       class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                       placeholder="100">
            </div>
        </div>
        <div class="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Current Value</label>
                <input type="number"
                       name="key_results[INDEX][current_value]"
                       class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                       placeholder="0" value="0">
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Unit</label>
                <input type="text"
                       name="key_results[INDEX][unit]"
                       class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                       placeholder="% | users | $ ...">
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Weight (0-100)</label>
                <input type="number"
                       name="key_results[INDEX][weight]"
                       min="0" max="100" step="1"
                       class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                       placeholder="e.g., 20">
            </div>
            <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Progress (%)</label>
                <input type="number"
                       name="key_results[INDEX][progress_percent]"
                       min="0" max="100" step="1"
                       class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200"
                       placeholder="0" value="0">
            </div>
        </div>
        <div class="mt-4 space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Description</label>
            <textarea name="key_results[INDEX][description]" 
                      rows="2"
                      class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 resize-none"
                      placeholder="Additional details about this key result..."></textarea>
        </div>
    </div>
`;

document.getElementById('add-key-result').addEventListener('click', function() {
    const container = document.getElementById('key-results-container');
    const newKeyResult = document.createElement('div');
    
    // Replace INDEX placeholder with actual count
    const template = keyResultTemplate.replace(/INDEX/g, keyResultCount);
    newKeyResult.innerHTML = template;
    
    container.appendChild(newKeyResult);
    keyResultCount++;
    
    // Update button text after first key result is added
    if (keyResultCount === 1) {
        this.innerHTML = `
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Another Key Result
        `;
    }
    
    // Smooth scroll to new key result
    newKeyResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// Remove key result functionality
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-key-result') || e.target.closest('.remove-key-result')) {
        const keyResultItem = e.target.closest('.key-result-item');
        if (keyResultItem) {
            // Add fade out animation
            keyResultItem.style.transition = 'all 0.3s ease';
            keyResultItem.style.opacity = '0';
            keyResultItem.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                keyResultItem.remove();
                
                // Update button text if no key results left
                const container = document.getElementById('key-results-container');
                if (container.children.length === 0) {
                    document.getElementById('add-key-result').innerHTML = `
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Add Key Result
                    `;
                }
            }, 300);
        }
    }
});
</script>
@endsection