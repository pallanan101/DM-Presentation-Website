 // --- Modal Control Functions ---

        const modal = document.getElementById('create-post-modal');
        const createBtn = document.getElementById('create-post-btn');
        const form = document.getElementById('new-post-form');

        // Function to dynamically show/hide the file input based on post type
        function toggleFileInput() {
            const type = document.getElementById('post-type').value;
            const fileContainer = document.getElementById('file-input-container');
            const fileInput = document.getElementById('post-file');
            
            if (type === 'Image' || type === 'Video') {
                fileContainer.classList.remove('hidden');
                // fileInput.required = true; // Uncomment this in a real app to enforce file upload
            } else {
                fileContainer.classList.add('hidden');
                // fileInput.required = false;
                fileInput.value = ''; // Clear file selection when switching away
            }
        }

        // Function to open the modal
        function openPostModal(e) {
            e.preventDefault();
            modal.classList.remove('hidden');
            // Reset form content when opening
            form.reset(); 
            // Hide file input initially (it will be shown by toggleFileInput if needed)
            document.getElementById('file-input-container').classList.add('hidden');
            document.getElementById('mock-preview-output').textContent = "Preview content will appear here...";
        }

        // Function to close the modal
        function closePostModal() {
            modal.classList.add('hidden');
        }

        // Handle form submission (Mock logic)
        function handlePostSubmit(event) {
            event.preventDefault();
            
            const userId = document.getElementById('post-user-id').value;
            const type = document.getElementById('post-type').value;
            const content = document.getElementById('post-content').value;
            const fileInput = document.getElementById('post-file');
            const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : 'No file uploaded';

            console.log(`--- SUBMITTING NEW POST ---`);
            console.log(`User ID: ${userId}`);
            console.log(`Type: ${type}`);
            console.log(`Content: ${content.substring(0, 50)}...`);
            console.log(`File: ${fileName}`); // Log file name
            
            // In a real application, you would handle the file upload here.
            
            // Mock success message/action
            document.getElementById('mock-preview-output').textContent = 
                `SUCCESS: Post of type '${type}' submitted by ${userId}. File: ${fileName}. (Mock action)`;

            // Close the modal after a short delay to show the success message
            setTimeout(closePostModal, 1500); 
        }

        // Mock Preview Function
        function mockPreview() {
            const type = document.getElementById('post-type').value;
            const content = document.getElementById('post-content').value;
            const fileInput = document.getElementById('post-file');
            const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : 'No file selected';
            
            const previewElement = document.getElementById('mock-preview-output');

            if (content.trim() === '' && fileName === 'No file selected') {
                previewElement.textContent = "Please enter content or select a file to generate a preview.";
                return;
            }

            let previewText;
            switch(type) {
                case 'Image':
                    previewText = `🖼️ Image Post Preview. File: ${fileName}. Text: "${content.substring(0, 50)}..."`;
                    break;
                case 'Video':
                    previewText = `▶️ Video Post Preview. File: ${fileName}. Text: "${content.substring(0, 50)}..."`;
                    break;
                case 'Article':
                default:
                    previewText = `📄 Article Preview: "${content.substring(0, 150)}..."`;
            }
            previewElement.textContent = previewText;
        }


        // --- Event Listeners ---
        createBtn.addEventListener('click', openPostModal);

        // Allow closing modal by clicking outside it (optional)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePostModal();
            }
        });