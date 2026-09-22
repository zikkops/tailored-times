// The 15 templates on the live site (21 Sep 2026), in gallery order.
// Seeds the `templates` table (supabase/seed.sql) and is the fallback when
// Supabase isn't configured. `legacySlug` is the old WordPress URL; it
// 301-redirects to /templates/<slug> (see next.config.ts).

export type TemplateSeed = {
  slug: string;
  legacySlug: string;
  name: string;
  category: string;
  blurb: string;
  previewImages: string[]; // copied from the live site into public/templates/<slug>/, cover first
};

export const TEMPLATES: TemplateSeed[] = [
  {
    slug: "birthday",
    legacySlug: "birthday-template",
    name: "Birthday 1",
    category: "Birthdays",
    blurb: "Turn any birthday into headline news with a fun, personalized newspaper-style template — perfect for parties, posts, or keepsakes.",
    previewImages: ["/templates/birthday/1.jpg", "/templates/birthday/2.jpg", "/templates/birthday/3.jpg", "/templates/birthday/4.jpg"],
  },
  {
    slug: "birthday-2",
    legacySlug: "birthday-template-2",
    name: "Birthday 2",
    category: "Birthdays",
    blurb: "A celebration of the lives we've lived and the moments that shaped us—every laugh, every tear, every wild detour. This is where memories rise, milestones shine, and another chapter begins with a bang.",
    previewImages: ["/templates/birthday-2/1.png", "/templates/birthday-2/2.png", "/templates/birthday-2/3.png", "/templates/birthday-2/4.png"],
  },
  {
    slug: "anniversary",
    legacySlug: "anniversary-template",
    name: "Anniversary",
    category: "Anniversary",
    blurb: "Celebrate love like it's front-page news with a custom anniversary newspaper — a fun, personal way to relive the story of \"us.\"",
    previewImages: ["/templates/anniversary/1.jpg", "/templates/anniversary/2.jpg", "/templates/anniversary/3.jpg", "/templates/anniversary/4.jpg"],
  },
  {
    slug: "retirement",
    legacySlug: "retirement-template",
    name: "Retirement",
    category: "Retirements",
    blurb: "Mark the end of an era with a personalized retirement newspaper — a memorable tribute to years of hard work, impact, and office legends.",
    previewImages: ["/templates/retirement/1.jpg", "/templates/retirement/2.jpg", "/templates/retirement/3.jpg"],
  },
  {
    slug: "mothers-fathers-day",
    legacySlug: "mothers-day-template",
    name: "Mother's / Father's Day",
    category: "Mother's & Father's day",
    blurb: "Celebrate Mom like the star she is with a custom newspaper — filled with love, laughs, and headline-worthy memories.",
    previewImages: ["/templates/mothers-fathers-day/1.jpg", "/templates/mothers-fathers-day/2.jpg", "/templates/mothers-fathers-day/3.jpg", "/templates/mothers-fathers-day/4.jpg"],
  },
  {
    slug: "summer-camp",
    legacySlug: "summer-camp-template",
    name: "Summer Camp",
    category: "Summer camp souvenir",
    blurb: "Capture campfire laughs and adventure-packed days with a custom summer camp newspaper — the perfect keepsake for unforgettable memories.",
    previewImages: ["/templates/summer-camp/1.jpg", "/templates/summer-camp/2.jpg", "/templates/summer-camp/3.jpg", "/templates/summer-camp/4.jpg"],
  },
  {
    slug: "menu",
    legacySlug: "menu-template",
    name: "Menu",
    category: "Menu",
    blurb: "Serve up your dishes in style with a custom newspaper-style menu — a unique way to add charm and character to any dining experience.",
    previewImages: ["/templates/menu/1.jpg", "/templates/menu/2.jpg", "/templates/menu/3.jpg", "/templates/menu/4.jpg"],
  },
  {
    slug: "christian-wedding",
    legacySlug: "christan-wedding-template",
    name: "Wedding 1 (Christian)",
    category: "Wedding",
    blurb: "A celebration of love, faith, and forever. This Christian wedding brings together two souls in holy matrimony, surrounded by blessings, vows, and cherished traditions—captured in timeless memories.",
    previewImages: ["/templates/christian-wedding/1.jpg", "/templates/christian-wedding/2.jpg", "/templates/christian-wedding/3.jpg", "/templates/christian-wedding/4.jpg"],
  },
  {
    slug: "muslim-wedding",
    legacySlug: "muslim-wedding-template",
    name: "Wedding 2 (Muslim)",
    category: "Wedding",
    blurb: "A heartfelt union under the light of tradition and prayer. This Nikah ceremony marks the beginning of a shared journey built on love, faith, and divine blessings—honoring sacred customs and celebrating new beginnings.",
    previewImages: ["/templates/muslim-wedding/1.jpg", "/templates/muslim-wedding/2.jpg", "/templates/muslim-wedding/3.jpg", "/templates/muslim-wedding/4.jpg"],
  },
  {
    slug: "basketball-tribute",
    legacySlug: "basketball-tribute",
    name: "Basketball Tribute",
    category: "Sports tribute",
    blurb: "A tribute to the court kings and queens who gave it their all—every bounce, every shot, every heartbeat. This is where hustle meets passion, where teamwork makes history, and where love for the game lives on.",
    previewImages: ["/templates/basketball-tribute/1.jpg", "/templates/basketball-tribute/2.jpg", "/templates/basketball-tribute/3.jpg", "/templates/basketball-tribute/4.jpg"],
  },
  {
    slug: "events",
    legacySlug: "events-template",
    name: "Events",
    category: "Events",
    blurb: "From milestones to memories in the making, this event is more than just a date on the calendar—it's a celebration of life, laughter, and the people who make it unforgettable.",
    previewImages: ["/templates/events/1.jpg", "/templates/events/2.jpg", "/templates/events/3.jpg", "/templates/events/4.jpg"],
  },
  {
    slug: "baby-shower",
    legacySlug: "baby-shower-template",
    name: "Baby Shower",
    category: "Baby showers",
    blurb: "A day filled with love, laughter, and lullabies. This baby shower celebrates the joy of new beginnings, tiny kicks, and the big love growing every day. Here's to the bundle of joy we can't wait to meet!",
    previewImages: ["/templates/baby-shower/1.jpg", "/templates/baby-shower/2.jpg", "/templates/baby-shower/3.jpg", "/templates/baby-shower/4.jpg"],
  },
  {
    slug: "corporate",
    legacySlug: "corporate-template",
    name: "Corporate",
    category: "Corporate",
    blurb: "Highlight milestones, achievements, or company culture with a sleek, newspaper-style template — perfect for internal shoutouts or client-facing celebrations.",
    previewImages: ["/templates/corporate/1.jpg", "/templates/corporate/2.jpg", "/templates/corporate/3.jpg", "/templates/corporate/4.jpg"],
  },
  {
    slug: "fashion-magazine",
    legacySlug: "fashion-magazine-template",
    name: "Fashion Magazine",
    category: "Fashion",
    blurb: "A tribute to the icons who turned sidewalks into catwalks—every strut, every stare, every statement made. This is where style became identity, where confidence was couture, and where fashion wrote its own rules.",
    previewImages: ["/templates/fashion-magazine/1.png", "/templates/fashion-magazine/2.png", "/templates/fashion-magazine/3.png", "/templates/fashion-magazine/4.png"],
  },
  {
    slug: "promotion",
    legacySlug: "promotion-template",
    name: "Promotion",
    category: "Promotions",
    blurb: "A nod to the icons in the making—every capsule, every cut, every curve celebrated. This is not just a promo, it's a personal style revolution.",
    previewImages: ["/templates/promotion/1.png", "/templates/promotion/2.png", "/templates/promotion/3.png", "/templates/promotion/4.png"],
  },
];
