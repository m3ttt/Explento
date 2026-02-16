export default {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  setupFiles: ["dotenv/config"], // variabili d'ambiente
  setupFilesAfterEnv: ["<rootDir>/testing/jest.setup.ts"],
  testMatch: ["<rootDir>/testing/**/*.test.ts"], // assicura di testare solo i .ts per i tests e non altri
  testPathIgnorePatterns: ["<rootDir>/dist/"],
};
