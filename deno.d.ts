declare module "https://*" {
  export const assertEquals: (actual: unknown, expected: unknown, msg?: string) => void;
  export const assertNotEquals: (actual: unknown, expected: unknown, msg?: string) => void;
  export const assert: (expr: unknown, msg?: string) => void;
  const content: any;
  export default content;
}

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  }
  export const env: Env;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare const Deno: {
  env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
  test(name: string, fn: () => void | Promise<void>): void;
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
