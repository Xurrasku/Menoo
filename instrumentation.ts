import { registerOTel } from "@vercel/otel";

export function register() {
  return registerOTel();
}

