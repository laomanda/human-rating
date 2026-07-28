declare const Deno: {
  env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
  };
  test(name: string, fn: () => void | Promise<void>): void;
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
