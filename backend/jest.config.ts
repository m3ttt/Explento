export default {
  preset: "ts-jest/presets/default-esm", // Usa il preset specifico per ESM
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"], // tratta i .ts come moduli ES
  verbose: true,
  setupFiles: ["dotenv/config"],
  setupFilesAfterEnv: ["<rootDir>/testing/jest.setup.ts"],
  testMatch: ["<rootDir>/testing/**/*.test.ts"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', 
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true, // Forza ts-jest a usare l'output ESM
      },
    ],
  },
};