
console.log("NikolausDAO AI Node - Node.JS is running!");

const inferenceApiUrl = "http://127.0.0.1:5000/generate";

/** Used to generate a new 3D model */
async function generateModel(prompt) {
    console.log("Calling AI inference server with prompt: " + prompt + " ...");
    const encodedPrompt = encodeURIComponent(prompt);
    const response = await fetch(`${inferenceApiUrl}?prompt=${encodedPrompt}`, {
        method: "GET",
    });
    const data = await response.json();
    const files = data.files;
    const firstFile = files[0];
    // Download the first file
    const downloadResponse = await fetch(firstFile);
    const blob = await downloadResponse.blob();
    // Return .obj file content
    return blob;
}
