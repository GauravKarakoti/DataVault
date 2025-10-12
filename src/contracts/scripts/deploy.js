// Example structure for a deployment script using Hardhat and Ethers.js
async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const ComplianceStorage = await ethers.getContractFactory("ComplianceStorage");
  
  // Deploy the contract
  const complianceStorage = await ComplianceStorage.deploy();
  await complianceStorage.waitForDeployment();

  const contractAddress = await complianceStorage.getAddress();
  console.log("ComplianceStorage deployed to:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });