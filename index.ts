import { file } from "bun";

// Function to download a file from a URL
async function downloadFile(url: string, outputPath: string, notFoundLog: string[]) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                notFoundLog.push(url);
            }
            throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
        }

        await Bun.write(outputPath, response);
        console.log(`✅ Downloaded: ${outputPath}`);
    } catch (error: any) {
        console.error(`❌ Error downloading ${url}:`, error.message);
    }
}

// Function to process the CSV and download files
async function processCSV(csvPath: string) {
    try {
        // Read and parse CSV file
        const csvContent = await file(csvPath).text();
        const lines = csvContent.split('\n').filter(line => line.trim());

        // Skip header if exists and process each URL
        const startIndex = lines[0].toLowerCase().includes('url') ? 1 : 0;

        console.log(`📥 Starting downloads for ${lines.length - startIndex} files...\n`);

        // Array to store 404 not found URLs
        const notFoundLog: string[] = [];

        // Process each URL
        const downloads = lines.slice(startIndex).map(async (line) => {
            const url = line.trim();
            if (!url) return;

            // Extract filename from URL or generate one
            const fileName = url.split('/').pop() || `file-${Date.now()}`;
            const outputPath = `downloads/${fileName}`;

            await downloadFile(url, outputPath, notFoundLog);
        });

        // Wait for all downloads to complete
        await Promise.all(downloads);

        // Write 404 not found URLs to log.json
        if (notFoundLog.length > 0) {
            await Bun.write('log.json', JSON.stringify(notFoundLog, null, 2));
            console.log(`\n📝 Logged 404 URLs to log.json`);
        }

        console.log('\n✨ All downloads completed!');
    } catch (error: any) {
        console.error('❌ Error processing CSV:', error.message);
    }
}

// Check if CSV file path is provided
const csvPath = process.argv[2];
if (!csvPath) {
    console.error('Please provide a path to the CSV file');
    console.log('Usage: bun run index.ts <path-to-csv>');
    process.exit(1);
}

// Start processing
await processCSV(csvPath);
