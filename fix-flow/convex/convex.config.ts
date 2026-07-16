import { defineApp } from "convex/server";
import geospatial from "@convex-dev/geospatial/convex.config.js";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";

const app = defineApp();
app.use(geospatial);
app.use(rateLimiter);

export default app;
