import assert from "node:assert/strict";
import test from "node:test";

import { copyTextToClipboard } from "@/lib/copy-to-clipboard";

type MutableGlobal = typeof globalThis & {
  navigator?: Navigator;
  document?: Document;
};

const runtimeGlobal = globalThis as MutableGlobal;
type GlobalProperty = "navigator" | "document";

const captureDescriptor = (property: GlobalProperty) => {
  return Object.getOwnPropertyDescriptor(runtimeGlobal, property);
};

const defineGlobalProperty = <K extends GlobalProperty>(property: K, value: MutableGlobal[K]) => {
  Object.defineProperty(runtimeGlobal, property, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
};

const deleteGlobalProperty = (property: GlobalProperty) => {
  Reflect.deleteProperty(runtimeGlobal, property);
};

const restoreGlobalProperty = (property: GlobalProperty, descriptor?: PropertyDescriptor) => {
  if (!descriptor) {
    deleteGlobalProperty(property);
    return;
  }

  Object.defineProperty(runtimeGlobal, property, descriptor);
};

test("copyTextToClipboard uses the modern clipboard API when available", async () => {
  const navigatorDescriptor = captureDescriptor("navigator");

  try {
    let captured = "";
    defineGlobalProperty("navigator", {
      clipboard: {
        writeText: async (value: string) => {
          captured = value;
        },
      },
    } as Navigator);

    const result = await copyTextToClipboard("https://example.com/menu");

    assert.equal(result, true);
    assert.equal(captured, "https://example.com/menu");
  } finally {
    restoreGlobalProperty("navigator", navigatorDescriptor);
  }
});

test("copyTextToClipboard falls back to execCommand when navigator.clipboard is unavailable", async () => {
  const navigatorDescriptor = captureDescriptor("navigator");
  const documentDescriptor = captureDescriptor("document");

  try {
    deleteGlobalProperty("navigator");

    let appendCount = 0;
    let execCommandCalledWith: string | null = null;
    const fakeTextarea = {
      value: "",
      style: {} as Record<string, string>,
      setAttribute: () => {},
      select: () => {},
      setSelectionRange: () => {},
    };

    const fakeDocument = {
      body: {
        appendChild: (node: unknown) => {
          assert.equal(node, fakeTextarea);
          appendCount += 1;
        },
        removeChild: (node: unknown) => {
          assert.equal(node, fakeTextarea);
          appendCount -= 1;
        },
      },
      createElement: (tag: string) => {
        assert.equal(tag, "textarea");
        return fakeTextarea;
      },
      execCommand: (command: string) => {
        execCommandCalledWith = command;
        return true;
      },
    } as Document;

    defineGlobalProperty("document", fakeDocument);

    const result = await copyTextToClipboard("fallback");

    assert.equal(result, true);
    assert.equal(execCommandCalledWith, "copy");
    assert.equal(appendCount, 0);
  } finally {
    restoreGlobalProperty("navigator", navigatorDescriptor);
    restoreGlobalProperty("document", documentDescriptor);
  }
});

test("copyTextToClipboard resolves false when no clipboard strategies exist", async () => {
  const navigatorDescriptor = captureDescriptor("navigator");
  const documentDescriptor = captureDescriptor("document");

  try {
    deleteGlobalProperty("navigator");
    deleteGlobalProperty("document");

    const result = await copyTextToClipboard("noop");
    assert.equal(result, false);
  } finally {
    restoreGlobalProperty("navigator", navigatorDescriptor);
    restoreGlobalProperty("document", documentDescriptor);
  }
});

