import existing from "./existing-skills.json";

export const additions = [
  { slug: "engineering", name: "Engineering & Technical", skills: ["Web Development", "Electrical Installation", "Electronics Repair", "Computer Maintenance"] },
  { slug: "design", name: "Design & Creative", skills: ["Illustration", "Interior Design", "Furniture Design"] },
  { slug: "business", name: "Business & Strategy", skills: ["Bookkeeping", "Budgeting", "Customer Service", "Procurement", "Inventory Management"] },
  { slug: "marketing", name: "Marketing & Growth", skills: ["Customer Research", "Community Management"] },
  { slug: "science", name: "Science & Research", skills: ["Laboratory Techniques", "Survey Design", "Statistical Analysis"] },
  { slug: "communication", name: "Communication & Media", skills: ["Audio Production", "Translation", "Editing & Proofreading"] },
  { slug: "management", name: "Management & Leadership", skills: ["Event Planning", "Volunteer Coordination"] },
  { slug: "fashion-textiles", name: "Fashion & Textiles", skills: ["Sewing & Garment Construction", "Pattern Making", "Textile Printing", "Weaving", "Embroidery"] },
  { slug: "food-agriculture-hospitality", name: "Food, Agriculture & Hospitality", skills: ["Food Preparation", "Baking", "Food Preservation", "Crop Production", "Hospitality Service"] },
  { slug: "trades-manufacturing-construction", name: "Trades, Manufacturing & Construction", skills: ["Carpentry", "Welding & Fabrication", "Masonry", "Plumbing", "CAD Drafting"] },
  { slug: "education-community", name: "Education & Community", skills: ["Tutoring", "Lesson Planning", "Learning Material Development", "Community Outreach", "Accessibility Support"] },
];
export const skillFamilies = additions.map((family) => ({ ...family,
  skills: [...(existing.find((row) => row.slug === family.slug)?.skills ?? []), ...family.skills],
}));

// Keep established slugs/IDs when broadening labels. Retired narrow sectors map below.
export const sectors = [
  ["technology", "Technology"], ["agritech", "Food & Agriculture"],
  ["fashion-design", "Fashion & Design"], ["retail-commerce", "Business & Retail"],
  ["education", "Education"], ["health-biotech", "Health & Wellbeing"],
  ["media-creative", "Media & Entertainment"], ["clean-energy", "Environment & Energy"],
  ["manufacturing", "Manufacturing & Construction"], ["logistics-mobility", "Transport & Logistics"],
  ["hospitality-tourism", "Hospitality & Tourism"], ["social-impact", "Community & Social Impact"],
] as const;
export const legacySectorMappings = { fintech: "retail-commerce", "ai-data": "technology" } as const;
export const availability = [
  { id: "under-5", label: "Under 5 hours" }, { id: "5-10", label: "5–10 hours" },
  { id: "11-15", label: "11–15 hours" }, { id: "16-plus", label: "16+ hours" },
];
