async function checkApiConnection() {
    try {
        const response = await fetch('/ping');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.status === 'ok';
    } catch (error) {
        console.error('API connection check failed:', error);
        return false;
    }
}

async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const statusOutput = document.getElementById('statusOutput');
    const resultOutput = document.getElementById('resultOutput');

    // Check API connection first
    statusOutput.textContent = 'Checking API connection...';
    const isConnected = await checkApiConnection();
    if (!isConnected) {
        statusOutput.textContent = 'Error: Cannot connect to API server';
        return;
    }

    if (!fileInput.files.length) {
        statusOutput.textContent = 'Please select a file';
        return;
    }

    const formData = new FormData();
    formData.append('document', fileInput.files[0]);

    try {
        // Create conversion job
        statusOutput.textContent = 'Creating conversion job...';
        const response = await fetch('/conversion-jobs', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const jobId = data.job_id;

        // Poll for results
        statusOutput.textContent = 'Processing document...';
        await pollTaskStatus(jobId);
    } catch (error) {
        console.error('Upload error:', error);
        statusOutput.textContent = `Error: ${error.message}`;
    }
}

async function pollTaskStatus(jobId) {
    const statusOutput = document.getElementById('statusOutput');
    const resultOutput = document.getElementById('resultOutput');

    while (true) {
        try {
            const response = await fetch(`/conversion-jobs/${jobId}`);
            const data = await response.json();

            statusOutput.textContent = `Status: ${data.status}`;

            if (data.status === 'SUCCESS') {
                // Format the result nicely
                const result = data.result;
                let displayText = `Filename: ${result.filename}\n\nMarkdown Content:\n${result.markdown}`;
                if (result.images && result.images.length > 0) {
                    displayText += '\n\nImages:\n';
                    result.images.forEach(img => {
                        displayText += `- ${img.type}: ${img.filename}\n`;
                    });
                }
                resultOutput.textContent = displayText;
                break;
            } else if (data.status === 'FAILURE') {
                resultOutput.textContent = `Task failed: ${data.error || 'Unknown error'}`;
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            statusOutput.textContent = `Error polling status: ${error.message}`;
            break;
        }
    }
}
