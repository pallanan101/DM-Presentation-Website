
    // --- DOM ELEMENTS ---
    const dateFilterButton = document.getElementById('date-filter-button');
    const dateFilterDropdown = document.getElementById('date-filter-dropdown');
    const applyFilterButton = document.getElementById('apply-filter-button');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const dateRangeDisplay = document.getElementById('date-range-display');


    const dateFilterButton2 = document.getElementById('date-filter-button2');
    const dateFilterDropdown2 = document.getElementById('date-filter-dropdown2');
    const applyFilterButton2 = document.getElementById('apply-filter-button2');
    const startDateInput2 = document.getElementById('start-date2');
    const endDateInput2 = document.getElementById('end-date2');
    const dateRangeDisplay2 = document.getElementById('date-range-display2');


    const dateFilterButton3 = document.getElementById('date-filter-button3');
    const dateFilterDropdown3 = document.getElementById('date-filter-dropdown3');
    const applyFilterButton3 = document.getElementById('apply-filter-button3');
    const startDateInput3 = document.getElementById('start-date3');
    const endDateInput3 = document.getElementById('end-date3');
    const dateRangeDisplay3 = document.getElementById('date-range-display3');

    

    // --- THEME APPLICATION LOGIC FOR LOADED CONTENT ---
    function updateContentTheme() {
        const isDark = localStorage.getItem('theme') === 'dark';

        // 1. Swap Main Containers (Stat Cards, Chart, Links, Dropdown)
        // Light: bg-gray-200, Dark: bg-gray-700 (Matches index.html's secondary background swap)
        const mainContainers = document.querySelectorAll(
            '.bg-gray-200.rounded-xl, #date-filter-dropdown, .hover\\:bg-gray-400'
        );
        mainContainers.forEach(el => {
            // Background Swap
            el.classList.remove(isDark ? 'bg-gray-200' : 'bg-gray-700');
            el.classList.add(isDark ? 'bg-gray-700' : 'bg-gray-200');

            // Hover Swap (for date button and links)
            if (el.classList.contains('hover:bg-gray-400') || el.classList.contains('hover:bg-gray-600')) {
                 el.classList.remove(isDark ? 'hover:bg-gray-400' : 'hover:bg-gray-600');
                 el.classList.add(isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-400');
            }
        });


        // 2. Swap Input Fields (Start/End Date)
        // Light: bg-gray-100, Dark: bg-gray-600 (Matches index.html's primary body background swap)
        document.querySelectorAll('#start-date, #end-date').forEach(el => {
            if (isDark) {
                el.classList.remove('bg-gray-100', 'border-gray-300');
                el.classList.add('bg-gray-600', 'border-gray-500'); 
            } else {
                el.classList.remove('bg-gray-600', 'border-gray-500');
                el.classList.add('bg-gray-100', 'border-gray-300');
            }
        });

        // 3. Swap Text Colors (Targeting primary and secondary text)
        document.querySelectorAll('.text-gray-900, .text-gray-500, .text-gray-600, .text-gray-100, .text-gray-400').forEach(el => {
            // Preserve colored status text (green, red, orange, blue, purple)
            if (!el.classList.contains('text-green-500') && !el.classList.contains('text-red-500') && !el.classList.contains('text-orange-400') && !el.classList.contains('text-blue-400') && !el.classList.contains('text-purple-400')) {
                
                if (isDark) {
                    // Primary text (900 -> 100)
                    if (el.classList.contains('text-gray-900')) {
                        el.classList.remove('text-gray-900');
                        el.classList.add('text-gray-100');
                    } 
                    // Secondary text (500/600 -> 400)
                    else if (el.classList.contains('text-gray-500') || el.classList.contains('text-gray-600')) {
                        el.classList.remove('text-gray-500', 'text-gray-600');
                        el.classList.add('text-gray-400');
                    }
                } else {
                    // Dark to Light Revert
                    if (el.classList.contains('text-gray-100')) {
                        el.classList.remove('text-gray-100');
                        el.classList.add('text-gray-900');
                    } else if (el.classList.contains('text-gray-400')) {
                         // Decide if it was secondary card text (500) or date label (600)
                        el.classList.remove('text-gray-400');
                        // We must make a best guess, let's use 500 as the default secondary text color
                        el.classList.add('text-gray-500'); 
                    }
                }
            }
        });
    }

    // --- DATE LOGIC ---
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    function updateDateInputs(SDI, EDI, DRP, start, end) {
        if (SDI && EDI && DRP) {
            SDI.value = formatDate(start);
            EDI.value = formatDate(end);
            DRP.textContent = `${formatDate(start)} - ${formatDate(end)}`;
        }
    }

    function initializeDateRange(SDI, EDI   ,DRP    ) {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        updateDateInputs(SDI    ,EDI    , DRP,lastWeek, today);
    }
    initializeDateRange(startDateInput  ,endDateInput   ,dateRangeDisplay);
    initializeDateRange(startDateInput2  ,endDateInput2   ,dateRangeDisplay2);
    initializeDateRange(startDateInput3  ,endDateInput3   ,dateRangeDisplay3);
    

    if (dateFilterButton) {
        dateFilterButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dateFilterDropdown.classList.toggle('hidden');
        });
    }
    if (dateFilterButton2) {
        dateFilterButton2.addEventListener('click', (e) => {
            e.stopPropagation();
            dateFilterDropdown2.classList.toggle('hidden');
        });
    }
    if (dateFilterButton3) {
        dateFilterButton3.addEventListener('click', (e) => {
            e.stopPropagation();
            dateFilterDropdown3.classList.toggle('hidden');
        });
    }

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (dateFilterDropdown && !dateFilterDropdown.contains(e.target) && !dateFilterButton.contains(e.target)) {
            dateFilterDropdown.classList.add('hidden');
        }
    });
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (dateFilterDropdown2 && !dateFilterDropdown2.contains(e.target) && !dateFilterButton2.contains(e.target)) {
            dateFilterDropdown2.classList.add('hidden');
        }
    });
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (dateFilterDropdown3 && !dateFilterDropdown3.contains(e.target) && !dateFilterButton3.contains(e.target)) {
            dateFilterDropdown3.classList.add('hidden');
        }
    });

    // --- CHART LOGIC ---
  
    // This observer reacts to the main app's body class change (triggered by theme toggle) 
    // to keep the dashboard content in sync.
    const themeChangeObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class' && mutation.target === document.body) {
                
            }
        });
    });
    
    // Start observing the body tag for theme class changes
    themeChangeObserver.observe(document.body, { attributes: true });


    // Initialize the chart and theme on load (the router runs this script)
    
