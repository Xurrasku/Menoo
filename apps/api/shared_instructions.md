# Background

## Business Context

This agency creates digital HTML menus for restaurants by analyzing their existing website styles and generating matching menu designs.

## Target Audience

Restaurant owners and managers who want to create digital menus that match their restaurant's brand identity and website design.

## Workflow

1. User provides a restaurant website URL and menu content (optional)
2. MenuCreator agent analyzes the website to extract design elements and searches for menu pages
3. MenuCreator takes screenshots of found menu pages (supports multiple languages: menu, carta, menú, cardápio, etc.)
4. MenuCreator downloads menu files (PDFs, images) and converts PDFs to images
5. MenuCreator uses vision capabilities to read and analyze menu images, extracting menu content, structure, and design patterns
6. MenuCreator uses the style analysis and menu images to create a matching HTML menu
7. The final HTML menu is delivered ready for deployment

## Design Principles

- Brand consistency: Menus should match the restaurant's website design
- Responsiveness: Menus must work on all devices (desktop, tablet, mobile)
- Accessibility: Ensure good contrast, readable fonts, and semantic HTML
- Professional appearance: Clean, modern design that reflects restaurant quality
