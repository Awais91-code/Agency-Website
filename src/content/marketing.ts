export const services = [
  {
    eyebrow: "01",
    title: "Web platforms",
    href: "/services/web-development",
    description:
      "Fast, accessible websites and web applications designed around clear business goals and maintainable systems.",
    bullets: ["Marketing websites", "Web applications", "Ecommerce experiences", "Performance engineering"],
  },
  {
    eyebrow: "02",
    title: "Product & UI/UX",
    href: "/services/ui-ux-design",
    description:
      "Research-informed interfaces that reduce friction, communicate value quickly and stay consistent as products grow.",
    bullets: ["UX architecture", "Design systems", "Responsive product UI", "Prototype validation"],
  },
  {
    eyebrow: "03",
    title: "Automation",
    href: "/services/automation",
    description:
      "Connected workflows that remove repetitive operations while keeping important approvals under human control.",
    bullets: ["Lead workflows", "Internal operations", "API integrations", "n8n orchestration"],
  },
  {
    eyebrow: "04",
    title: "AI solutions",
    href: "/services/ai-solutions",
    description:
      "Practical AI features grounded in approved business knowledge, useful workflows and measurable outcomes.",
    bullets: ["AI assistants", "Knowledge retrieval", "Workflow copilots", "Custom integrations"],
  },
] as const;

export const capabilities = [
  "Next.js",
  "TypeScript",
  "Supabase",
  "PostgreSQL",
  "n8n",
  "API integrations",
  "Design systems",
  "Automation",
] as const;

export const processSteps = [
  {
    number: "01",
    title: "Discover",
    description: "Clarify goals, audience, constraints, existing systems and the result the project needs to create.",
  },
  {
    number: "02",
    title: "Scope",
    description: "Turn the brief into priorities, technical boundaries, milestones and a transparent delivery plan.",
  },
  {
    number: "03",
    title: "Design",
    description: "Shape the information architecture and interface around the user's most important decisions and actions.",
  },
  {
    number: "04",
    title: "Build",
    description: "Develop reusable, responsive components with secure server-side behavior and maintainable code.",
  },
  {
    number: "05",
    title: "QA",
    description: "Verify responsive behavior, accessibility, performance, validation, permissions and critical flows.",
  },
  {
    number: "06",
    title: "Launch & improve",
    description: "Ship carefully, monitor the experience and improve the product using real usage and business feedback.",
  },
] as const;

export const sampleProjects = [
  {
    label: "Platform concept",
    title: "Service business growth platform",
    category: "Web platform · Lead automation",
    description:
      "A conversion-led marketing experience connected to structured enquiries, qualification and follow-up workflows.",
    accent: "violet",
  },
  {
    label: "Product concept",
    title: "Operations command center",
    category: "Dashboard · Internal tooling",
    description:
      "A focused interface that brings operational status, action queues and key business signals into one workspace.",
    accent: "cyan",
  },
  {
    label: "Automation concept",
    title: "Client onboarding system",
    category: "Automation · Client experience",
    description:
      "A connected onboarding flow that coordinates forms, files, communication and internal handoffs without duplicate work.",
    accent: "amber",
  },
] as const;

export const principles = [
  {
    title: "Business-first decisions",
    description: "Technology and visual choices should support the business objective instead of becoming the objective.",
  },
  {
    title: "Clear communication",
    description: "Scope, decisions, risks and next actions stay visible so projects do not depend on guesswork.",
  },
  {
    title: "Systems that can grow",
    description: "Reusable components, structured content and stable interfaces reduce unnecessary rebuilds later.",
  },
] as const;

export const faqs = [
  {
    question: "What type of projects can the agency website support?",
    answer:
      "The platform is structured for websites, web applications, UI/UX engagements, automation projects and AI-enabled solutions. Service-specific detail pages are managed in M06, and related published work is connected through M07.",
  },
  {
    question: "Can a visitor request a project directly from the website?",
    answer:
      "Yes. The final platform includes a structured multi-step project brief and quote engine. That lead engine is delivered in M08 and connected to the CRM in M09.",
  },
  {
    question: "Will clients get their own dashboard?",
    answer:
      "Yes. The planned client portal includes project status, milestones, files, requests and approvals with client-isolated access controls. It is delivered in M14.",
  },
  {
    question: "Is the platform designed for automation?",
    answer:
      "Yes. The architecture separates business truth from automation so tools such as n8n can coordinate follow-ups, bookings and onboarding without becoming the source of record.",
  },
] as const;
