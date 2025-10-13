 const tableBody = document.getElementById('qa-table-body');
        const lastUpdated = document.getElementById('last-updated');
        const queueNameSearch = document.getElementById('queue-name-search');
        const queueTypeFilter = document.getElementById('queue-type-filter');
        const tableHeaders = document.querySelectorAll('#qa-table thead th');
        const manualRefreshTrigger = document.getElementById('manual-refresh-trigger');
        let refreshIntervalId; // Store the interval ID

        // --- Utility Functions for Latency and Time Formatting ---

        function formatLatency(ms) {
            if (ms < 60000) return '0m';
            let s = ms / 1000;
            const h = Math.floor(s / 3600);
            s %= 3600;
            const m = Math.floor(s / 60);
            
            let result = '';
            if (h > 0) result += `${h}h `;
            if (m > 0 || h === 0) result += `${m}m`;

            return result.trim();
        }

        function getLatencyClass(ms) {
            const ONE_MINUTE_MS = 60000;
            const THIRTY_MINUTES_MS = 30 * ONE_MINUTE_MS;
            const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;

            if (ms < THIRTY_MINUTES_MS) {
                return 'latency-green';
            } else if (ms <= ONE_HOUR_MS) {
                return 'latency-orange';
            } else {
                return 'latency-red';
            }
        }

        // --- Auto-Refresh Logic (Simulated) ---

        function refreshData() {
            tableBody.querySelectorAll('tr').forEach(row => {
                let currentPending = parseInt(row.cells[2].textContent);
                let currentLatency = parseFloat(row.dataset.latencyMs);

                let newPending = Math.max(0, currentPending + Math.floor(Math.random() * 7) - 3);
                row.cells[2].textContent = newPending;

                const FIVE_MINUTES_MS = 5 * 60000;
                let newLatency = Math.max(0, currentLatency + (Math.random() * 2 * FIVE_MINUTES_MS) - FIVE_MINUTES_MS);
                
                const latencySpan = row.querySelector('.latency-cell');
                const newLatencyClass = getLatencyClass(newLatency);
                
                latencySpan.textContent = formatLatency(newLatency);
                latencySpan.className = `latency-cell ${newLatencyClass}`;
                
                row.dataset.latencyMs = newLatency;
            });

            applyFilters();
            lastUpdated.textContent = new Date().toLocaleTimeString();
        }

        /**
         * Starts the auto-refresh timer.
         */
        function startAutoRefresh() {
            refreshData();
            refreshIntervalId = setInterval(refreshData, 10000); // 10 seconds interval
        }

        /**
         * Triggers a manual refresh and resets the auto-refresh timer.
         */
        function handleManualRefresh() {
            clearInterval(refreshIntervalId); // Stop the current timer
            refreshData();                  // Perform the refresh immediately
            startAutoRefresh();             // Restart the timer
        }

        // --- Event Listeners ---
        
        manualRefreshTrigger.addEventListener('click', handleManualRefresh);

        startAutoRefresh(); 

        // --- Search/Filter Logic ---

        function applyFilters() {
            const nameFilter = queueNameSearch.value.toUpperCase();
            const typeFilter = queueTypeFilter.value.toUpperCase();
            const rows = tableBody.querySelectorAll('tr');
            
            let activeSort = document.querySelector('#qa-table thead th.sort-asc, #qa-table thead th.sort-desc');

            rows.forEach(row => {
                const queueName = row.cells[0].textContent.toUpperCase();
                const queueType = row.dataset.queueType.toUpperCase();

                const matchesName = queueName.includes(nameFilter);
                const matchesType = (typeFilter === '' || queueType === typeFilter);

                if (matchesName && matchesType) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
            
            if (activeSort) {
                const columnIndex = parseInt(activeSort.dataset.columnIndex);
                const sortDirection = activeSort.dataset.sort;
                sortTable(columnIndex, sortDirection, true);
            }
        }

        queueNameSearch.addEventListener('keyup', applyFilters);
        queueTypeFilter.addEventListener('change', applyFilters);

        // --- Column Sorting Logic ---

        function sortTable(columnIndex, sortDirection, isRefresh = false) {
            const rowsArray = Array.from(tableBody.querySelectorAll('tr'))
                .filter(row => row.style.display !== 'none');

            const isNumeric = (columnIndex === 2 || columnIndex === 3);

            rowsArray.sort((a, b) => {
                let aValue, bValue;

                if (isNumeric) {
                    if (columnIndex === 2) { 
                        aValue = parseInt(a.cells[columnIndex].textContent);
                        bValue = parseInt(b.cells[columnIndex].textContent);
                    } else if (columnIndex === 3) { 
                        aValue = parseFloat(a.dataset.latencyMs);
                        bValue = parseFloat(b.dataset.latencyMs);
                    }
                } else {
                    aValue = a.cells[columnIndex].textContent.toLowerCase();
                    bValue = b.cells[columnIndex].textContent.toLowerCase();
                }

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });

            rowsArray.forEach(row => tableBody.appendChild(row));
            
            Array.from(tableBody.querySelectorAll('tr'))
                .filter(row => row.style.display === 'none')
                .forEach(row => tableBody.appendChild(row));
        }

        // Add event listeners to all sortable headers
        tableHeaders.forEach(header => {
            if (header.classList.contains('sortable')) {
                header.addEventListener('click', function() {
                    let currentSort = header.dataset.sort || 'none';
                    let newSort = 'asc';

                    if (currentSort === 'asc') newSort = 'desc';
                    else if (currentSort === 'desc') newSort = 'asc';
                    
                    tableHeaders.forEach(h => {
                        h.classList.remove('sort-asc', 'sort-desc');
                        delete h.dataset.sort;
                    });

                    header.classList.add(`sort-${newSort}`);
                    header.dataset.sort = newSort;

                    const columnIndex = parseInt(header.dataset.columnIndex);
                    sortTable(columnIndex, newSort);
                });
            }
        });