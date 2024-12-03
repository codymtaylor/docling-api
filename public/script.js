async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const statusOutput = document.getElementById('statusOutput');
    const resultOutput = document.getElementById('resultOutput');

    if (!fileInput.files.length) {
        statusOutput.textContent = 'Please select a file';
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        // Upload file
        statusOutput.textContent = 'Uploading file...';
        const response = await fetch('/api/v1/process', {  // Using relative path since external port 80 is default
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const taskId = data.task_id;

        // Poll for results
        statusOutput.textContent = 'Processing document...';
        await pollTaskStatus(taskId);
    } catch (error) {
        statusOutput.textContent = `Error: ${error.message}`;
    }
}

async function pollTaskStatus(taskId) {
    const statusOutput = document.getElementById('statusOutput');
    const resultOutput = document.getElementById('resultOutput');

    while (true) {
        try {
            const response = await fetch(`/api/v1/task/${taskId}`);
            const data = await response.json();

            statusOutput.textContent = `Status: ${data.status}`;

            if (data.status === 'SUCCESS') {
                resultOutput.textContent = JSON.stringify(data.result, null, 2);
                break;
            } else if (data.status === 'FAILURE') {
                resultOutput.textContent = 'Task failed';
                break;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            statusOutput.textContent = `Error polling status: ${error.message}`;
            break;
        }
    }
}
