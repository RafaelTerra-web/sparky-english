// Vercel interprets 1 as "continue the build". The prebuild script checks
// every approved private music hash and fails the deployment if any differ.
console.log('Continuing build; prebuild will verify reviewed private music.');
process.exit(1);
