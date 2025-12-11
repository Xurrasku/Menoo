export const menuJsonSchema = {
  type: "object",
  properties: {
    restaurant_name: { type: "string" },
    language: { type: "string" },
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                price: { type: "number" },
                currency: { type: "string" },
              },
              required: ["name", "price"],
            },
          },
        },
        required: ["name", "items"],
      },
    },
  },
  required: ["categories"],
} as const;

export type ExtractedMenu = {
  restaurant_name?: string;
  language?: string;
  categories: Array<{
    name: string;
    items: Array<{
      name: string;
      description?: string;
      price: number;
      currency?: string;
    }>;
  }>;
};









