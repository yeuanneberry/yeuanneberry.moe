import type { ImageMetadata } from "astro";
import masqify from "../assets/work/masqify.png";
import tapin from "../assets/work/tapin.png";
import yappers from "../assets/work/yappers.png";
import softlysang from "../assets/work/softlysang.png";
import lkt from "../assets/work/lkt.png";

export interface WorkProject {
  slug: string;
  title: string;
  url: string;
  kind: string;
  role: string;
  relationship: string;
  description: string;
  goal: string;
  contribution: string;
  delivery: readonly string[];
  designCredit: string;
  stack: readonly string[];
  source: string | null;
  preview: ImageMetadata;
  previewAlt: string;
  status: string;
  reviewedAt: string;
  order: number;
}

export const projects: readonly WorkProject[] = [
  {
    slug: "masqify",
    title: "Masqify",
    url: "https://masqify.me/",
    kind: "Web application",
    role: "Full implementation",
    relationship: "Delivered through Yappers",
    description: "A temporary-email application with an address and inbox interface.",
    goal: "Give temporary email a dedicated web interface, bringing the address and incoming messages into one place.",
    contribution: "I handled the full implementation of Masqify through Yappers. Branding and theme were outside my contribution.",
    delivery: [
      "Implemented the temporary-email web application.",
      "Brought the address and inbox experience into the browser interface.",
    ],
    designCredit: "Branding and theme are separate from my implementation credit.",
    stack: [],
    source: null,
    preview: masqify,
    previewAlt: "Masqify's public temporary-email homepage and inbox interface.",
    status: "Public website",
    reviewedAt: "2026-10-26",
    order: 1,
  },
  {
    slug: "tapin",
    title: "TapIn",
    url: "https://tapinattendance.app/",
    kind: "Attendance application",
    role: "Full implementation",
    relationship: "Delivered through Yappers",
    description: "An NFC attendance project with a public introduction and dashboard entry.",
    goal: "Make an NFC attendance project accessible through the web, with a place to understand the workflow and enter the application.",
    contribution: "I handled the full implementation of TapIn through Yappers. Branding and theme were outside my contribution.",
    delivery: [
      "Implemented the web application for the NFC attendance project.",
      "Built the public presentation of the attendance workflow and its dashboard entry.",
    ],
    designCredit: "Branding and theme are separate from my implementation credit.",
    stack: [],
    source: null,
    preview: tapin,
    previewAlt: "TapIn's public homepage introducing its NFC attendance project.",
    status: "Public website",
    reviewedAt: "2026-10-26",
    order: 2,
  },
  {
    slug: "yappers",
    title: "Yappers",
    url: "https://yappersph.vercel.app/",
    kind: "Studio website",
    role: "Frontend implementation",
    relationship: "Delivered through Yappers",
    description: "The web frontend for a design studio's presentation and contact experience.",
    goal: "Bring the studio's identity and work into a public-facing website with a clear route to get in touch.",
    contribution: "I implemented the Yappers website frontend. The branding and theme were outside my contribution.",
    delivery: [
      "Implemented the studio's public web frontend.",
      "Translated the supplied visual direction into the website's presentation and contact entry.",
    ],
    designCredit: "Branding and theme are separate from my frontend implementation credit.",
    stack: [],
    source: null,
    preview: yappers,
    previewAlt: "The Yappers design studio's public website homepage.",
    status: "Public website",
    reviewedAt: "2026-10-26",
    order: 3,
  },
  {
    slug: "softlysang",
    title: "SoftlySang",
    url: "https://softlysang.com/",
    kind: "Personal website",
    role: "Design & full implementation",
    relationship: "Delivered through Yappers",
    description: "A birthday gift for my mother: a personal site about slow living, films, and homemaking.",
    goal: "Create a personal space for my mother, made as a birthday gift and shaped around the things she enjoys.",
    contribution: "I made the entire project, including the visuals and implementation. Like my other featured projects, SoftlySang was delivered through Yappers.",
    delivery: [
      "Created the visual direction and the complete website implementation.",
      "Built a personal home for slow-living, films, and homemaking content.",
      "Made the project as a birthday gift for my mother.",
    ],
    designCredit: "Visuals and implementation by me.",
    stack: [],
    source: null,
    preview: softlysang,
    previewAlt: "SoftlySang's public homepage for slow living, films, and homemaking.",
    status: "Public website",
    reviewedAt: "2026-10-26",
    order: 4,
  },
  {
    slug: "lkt",
    title: "LKT",
    url: "https://lkt.com.ph/",
    kind: "Company website",
    role: "Full implementation",
    relationship: "Delivered through Yappers",
    description: "A company website presenting documentation, finance, and IT services.",
    goal: "Give the company's documentation, finance, and IT services a public home on the web.",
    contribution: "I handled the full implementation of the public LKT website through Yappers. Branding and theme were outside my contribution.",
    delivery: [
      "Implemented the company's public website.",
      "Built the web presentation of its documentation, finance, and IT services.",
    ],
    designCredit: "Branding and theme are separate from my implementation credit.",
    stack: [],
    source: null,
    preview: lkt,
    previewAlt: "LKT's public company homepage presenting its services.",
    status: "Public website",
    reviewedAt: "2026-10-26",
    order: 5,
  },
];

export const featuredProjects = projects.slice(0, 3);
