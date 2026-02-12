import type { RestaurantMenuDetail } from "./service";

/**
 * Template data structure for rendering
 */
type TemplateData = {
  restaurantName: string;
  menuName?: string;
  categories: Array<{
    categoryName: string;
    categoryDescription?: string;
    items: Array<{
      itemName: string;
      itemDescription: string;
      itemPrice: string;
      itemCurrency: string;
      itemLabels?: string[];
      itemAllergens?: string[];
    }>;
  }>;
};

/**
 * Transforms menu data into template-friendly format
 */
function transformMenuData(
  restaurantName: string,
  menu: RestaurantMenuDetail,
): TemplateData {
  return {
    restaurantName,
    menuName: menu.name,
    categories: menu.categories
      .map((category) => ({
        categoryName: category.name,
        categoryDescription: category.description,
        items: category.dishes
          .filter((dish) => dish.isVisible)
          .map((dish) => ({
            itemName: dish.name,
            itemDescription: dish.description || "",
            itemPrice: dish.price.toFixed(2),
            itemCurrency: dish.currency,
            itemLabels: dish.labels,
            itemAllergens: dish.allergens,
          })),
      }))
      .filter((category) => category.items.length > 0), // Filter out empty categories
  };
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Renders a Mustache-style template with the provided data
 */
function renderTemplate(template: string, data: TemplateData): string {
  let result = template;

  // Replace simple variables first
  result = result.replace(/\{\{restaurantName\}\}/g, escapeHtml(data.restaurantName));
  if (data.menuName) {
    result = result.replace(/\{\{menuName\}\}/g, escapeHtml(data.menuName));
  }

  // Handle categories loop: {{#categories}}...{{/categories}}
  const categoriesPattern = /\{\{#categories\}\}([\s\S]*?)\{\{\/categories\}\}/g;
  result = result.replace(categoriesPattern, (match, content) => {
    return data.categories
      .map((category) => {
        let categoryContent = content;

        // Replace category-level variables
        categoryContent = categoryContent.replace(
          /\{\{categoryName\}\}/g,
          escapeHtml(category.categoryName),
        );
        if (category.categoryDescription) {
          categoryContent = categoryContent.replace(
            /\{\{categoryDescription\}\}/g,
            escapeHtml(category.categoryDescription),
          );
        }

        // Handle items loop within category: {{#items}}...{{/items}}
        const itemsPattern = /\{\{#items\}\}([\s\S]*?)\{\{\/items\}\}/g;
        categoryContent = categoryContent.replace(itemsPattern, (itemMatch, itemContent) => {
          return category.items
            .map((item) => {
              let renderedItem = itemContent;

              // Replace item variables
              renderedItem = renderedItem.replace(
                /\{\{itemName\}\}/g,
                escapeHtml(item.itemName),
              );
              renderedItem = renderedItem.replace(
                /\{\{itemDescription\}\}/g,
                escapeHtml(item.itemDescription),
              );
              renderedItem = renderedItem.replace(
                /\{\{itemPrice\}\}/g,
                escapeHtml(item.itemPrice),
              );
              renderedItem = renderedItem.replace(
                /\{\{itemCurrency\}\}/g,
                escapeHtml(item.itemCurrency),
              );

              // Handle optional arrays (labels, allergens)
              if (item.itemLabels && item.itemLabels.length > 0) {
                renderedItem = renderedItem.replace(
                  /\{\{#itemLabels\}\}([\s\S]*?)\{\{\/itemLabels\}\}/g,
                  (labelMatch, labelContent) => {
                    return item.itemLabels!
                      .map((label) =>
                        labelContent.replace(/\{\{label\}\}/g, escapeHtml(label)),
                      )
                      .join("");
                  },
                );
              } else {
                // Remove label block if no labels
                renderedItem = renderedItem.replace(
                  /\{\{#itemLabels\}\}[\s\S]*?\{\{\/itemLabels\}\}/g,
                  "",
                );
              }

              if (item.itemAllergens && item.itemAllergens.length > 0) {
                renderedItem = renderedItem.replace(
                  /\{\{#itemAllergens\}\}([\s\S]*?)\{\{\/itemAllergens\}\}/g,
                  (allergenMatch, allergenContent) => {
                    return item.itemAllergens!
                      .map((allergen) =>
                        allergenContent.replace(/\{\{allergen\}\}/g, escapeHtml(allergen)),
                      )
                      .join("");
                  },
                );
              } else {
                renderedItem = renderedItem.replace(
                  /\{\{#itemAllergens\}\}[\s\S]*?\{\{\/itemAllergens\}\}/g,
                  "",
                );
              }

              return renderedItem;
            })
            .join("");
        });

        return categoryContent;
      })
      .join("");
  });

  return result;
}

/**
 * Replaces template placeholders in HTML content with actual values
 * Supports Mustache-style syntax with loops: {{#categories}}, {{#items}}
 */
export function replaceHtmlPlaceholders(
  htmlContent: string,
  restaurantName: string,
  menu?: RestaurantMenuDetail,
): string {
  if (!menu) {
    // Simple replacement if no menu data
    return htmlContent.replace(/\{\{restaurantName\}\}/g, restaurantName);
  }

  const templateData = transformMenuData(restaurantName, menu);
  return renderTemplate(htmlContent, templateData);
}

/**
 * Checks if HTML content is a full HTML document (has <html> or <!DOCTYPE>)
 */
export function isFullHtmlDocument(htmlContent: string): boolean {
  const trimmed = htmlContent.trim();
  return (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<!doctype") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<HTML")
  );
}

/**
 * Extracts head content from HTML (styles, meta tags, etc.)
 */
export function extractHeadContent(htmlContent: string): {
  headContent: string;
  bodyContent: string;
} {
  // Try to extract <head> content
  const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[1] : "";

  // Try to extract <body> content
  const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : htmlContent;

  return { headContent, bodyContent };
}
