import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Expose toutes les routes Better Auth sous /api/auth/*
export const { GET, POST } = toNextJsHandler(auth.handler);
