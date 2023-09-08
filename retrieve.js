const dotenv = require("dotenv");
const Web3 = require("web3");
const abi = require("./abi.js");
const fs = require("fs");
const zlib = require("zlib");

dotenv.config();
// Initialize Web3 instance
const web3 = new Web3(
	process.env.INFURA_URL || process.env.ALCHEMY_URL || "http://localhost:8545"
);

const contractAddress = "0x9746fD0A77829E12F8A9DBe70D7a322412325B91";
const contractInstance = new web3.eth.Contract(abi, contractAddress);

function decodeAndUnzip(data) {
	// Decode from Base64
	let decodedData = Buffer.from(data, "base64");

	// Un-gzip
	zlib.gunzip(decodedData, (err, unzippedData) => {
		if (err) {
			console.error("Error during unzipping:", err);
			return;
		}
		// Convert the Buffer to a string
		let resultString = unzippedData.toString("utf-8");

		// rite to a file
		fs.writeFileSync("decoded.js", resultString);
		console.log("File saved successfully!");
	});
}

async function fetchFileData(filename) {
	try {
		const result = await contractInstance.methods.getFile(filename).call();
		console.log("Result:", JSON.stringify(result, null, 2));

		const storageAddresses = result[1].map((item) => item[1]);

		let allData = "";
		for (let address of storageAddresses) {
			const codeData = await web3.eth.getCode(address); // Fetch bytecode

			// debug
			// console.log(`Data at address ${address}:`, codeData);

			// Skip the first two characters (0x) and convert hex to ASCII
			const asciiData = web3.utils.hexToAscii("0x" + codeData.slice(2));
			allData += asciiData;
		}

		decodeAndUnzip(allData.trim()); // .trim() to remove padding and extra spaces
	} catch (error) {
		console.error("Error fetching file data:", error);
	}
}

// Call the function with the desired filename
fetchFileData("three-v0.147.0.min.js.gz");
