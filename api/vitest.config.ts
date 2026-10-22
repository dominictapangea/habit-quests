import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Opening and reopening SQLite files can stall for several seconds on a
    // busy Windows machine (antivirus scanning new files); 5 s was too tight.
    testTimeout: 30_000,
  },
});
