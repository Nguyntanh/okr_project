import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import axios from 'axios';
import debounce from 'lodash/debounce';

export default function UserSearchInput({ onUserSelect, initialUser, objectiveDepartmentId, currentUserRole }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [options, setOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);

    // Set initial selected user if provided
    useEffect(() => {
        if (initialUser && initialUser.user_id) {
            setSelectedOption({
                value: initialUser.user_id,
                label: initialUser.full_name + ' (' + initialUser.email + ')',
                user: initialUser
            });
        } else {
            setSelectedOption(null);
        }
    }, [initialUser]);

    // Debounced search function
    const debouncedSearch = useRef(
        debounce(async (query, departmentId, callback) => {
            if (!query) {
                callback([]);
                return;
            }

            setIsLoading(true);
            try {
                const params = { q: query };
                // Apply department filter if objective is unit-level and user is not admin/ceo
                if (departmentId && currentUserRole && !['admin', 'ceo'].includes(currentUserRole.toLowerCase())) {
                    params.department_id = departmentId;
                }
                
                const response = await axios.get('/api/users/search', { params });
                const users = response.data.data.map(user => ({
                    value: user.user_id,
                    label: user.full_name + ' (' + user.email + ')',
                    user: user
                }));
                callback(users);
            } catch (error) {
                console.error('Error fetching users:', error);
                callback([]);
            } finally {
                setIsLoading(false);
            }
        }, 300)
    ).current;

    // Load options when search query changes
    const loadOptions = (inputValue, callback) => {
        setSearchQuery(inputValue); // Update searchQuery state
        debouncedSearch(inputValue, objectiveDepartmentId, callback);
    };

    // Handle selection change
    const handleChange = (selectedOption) => {
        setSelectedOption(selectedOption);
        onUserSelect(selectedOption ? selectedOption.user : null);
    };

    return (
        <Select
            loadOptions={loadOptions}
            onChange={handleChange}
            onInputChange={(newValue) => setSearchQuery(newValue)} // Keep search query in sync
            inputValue={searchQuery}
            value={selectedOption}
            isClearable
            isSearchable
            isLoading={isLoading}
            placeholder="Tìm kiếm người dùng..."
            noOptionsMessage={() => "Không tìm thấy người dùng"}
            loadingMessage={() => "Đang tìm kiếm..."}
            defaultOptions={true} // Allow initial load of options when component mounts
            // Custom styling for better UX
            styles={{
                control: (base) => ({
                    ...base,
                    minHeight: '38px', // Match standard input height
                    borderColor: '#CBD5E0', // border-slate-300
                    '&:hover': {
                        borderColor: '#94A3B8', // hover:border-slate-400
                    },
                    boxShadow: 'none', // Remove default box-shadow
                    '&:focus': {
                        borderColor: '#2563EB', // focus:border-blue-500
                        boxShadow: '0 0 0 1px #2563EB', // focus:ring-1 focus:ring-blue-500
                    },
                }),
                menu: (base) => ({
                    ...base,
                    zIndex: 9999 // Ensure dropdown is above other elements
                }),
                option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#E0F2F7' : null, // bg-sky-100
                    color: '#1A202C', // text-gray-900
                    '&:active': {
                        backgroundColor: '#0EA5E9' // bg-sky-500
                    }
                }),
            }}
        />
    );
}
