import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./db/connect.js";
import { seedIfNeeded } from "./repositories/storyRepository.js";

await connectDatabase();
await seedIfNeeded();

const app = createApp();

app.listen(env.port, () => {
  console.info(`[api] UNCOVERED API listening on http://localhost:${env.port}`);
});
