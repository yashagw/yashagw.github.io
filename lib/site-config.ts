export const siteConfig = {
  title: "Yash Agarwal",
  description: "Personal website and blog of Yash Agarwal, Software Engineer",
  baseUrl: "https://yashagw.github.io",
  author: "Yash Agarwal",
  currentLocation: "Bangalore, India",
  theme: {
    toggleEnabled: false,
    defaultTheme: "dark" as "light" | "dark",
  },
};

export const navigation = [
  { name: "Home", url: "/" },
  { name: "Blog", url: "/blog/" },
  {
    name: "Resume",
    url: "https://drive.google.com/file/d/1GQ9fbXXdbGKR66xLCeZJAmXP7mwRr7O0/view?usp=drive_link",
    newTab: true,
  },
];

export const introParagraphs = [
  "I'm Yash Agarwal. I work at [https://averlon.ai]{Averlon}, a cybersecurity company, where I work on backend and AI agents.",
  "When I'm not shipping code at work, I'm deepening my systems understanding — currently building a [https://github.com/yashagw/cranedb]{relational database from scratch} in Go because the best way to understand something is to build it yourself.",
];

export const contactLinks = [
  {
    icon: "/icons/email.svg",
    text: "yash.ag@outlook.com",
    url: "mailto:yash.ag@outlook.com",
    newTab: false,
  },
  {
    icon: "/icons/twitter.svg",
    text: "@yashagw",
    url: "https://twitter.com/yashagw",
    newTab: true,
  },
  {
    icon: "/icons/linkedin.svg",
    text: "yashagw",
    url: "https://linkedin.com/in/yashagw",
    newTab: true,
  },
  {
    icon: "/icons/github.svg",
    text: "yashagw",
    url: "https://github.com/yashagw",
    newTab: true,
  },
];

export const skills = {
  languages: ["Go", "Python", "SQL", "JavaScript", "TypeScript"],
  technologies: ["AWS", "Azure", "Docker", "Kubernetes", "gRPC", "PostgreSQL", "Redis"],
};

export const projects = [
  {
    name: "CraneDB",
    description:
      "A relational database built from scratch in Go properly implementing ARIES recovery, buffer pool management, ACID transactions, and lock-based concurrency control.",
    url: "https://github.com/yashagw/cranedb",
    tags: ["Go", "Database", "SQL", "ACID", "ARIES"],
  },
  {
    name: "Event Management API",
    description:
      "A system for managing events and ticket bookings. Built as a robust gRPC service with secure JWT authentication, RBAC, and industry-standard API design.",
    url: "https://github.com/yashagw/event-management-api",
    tags: ["Go", "Backend", "gRPC", "PostgreSQL", "Authentication", "Authorization"],
  },
];

export const education = [
  {
    degree: "Bachelor of Technology",
    field: "Electrical Engineering",
    institution: "National Institute of Technology, Kurukshetra",
    year: "Dec 2020 – June 2024",
    gpa: "9.3 CGPA",
  },
  {
    degree: "CBSE - 12th Standard",
    field: "",
    institution: "Vyasa International School, Bangalore",
    year: "April 2019 – April 2020",
    gpa: "95.2%",
  },
];

export const companies = [
  {
    name: "Averlon",
    url: "https://averlon.ai",
    positions: [
      {
        title: "Software Engineer",
        duration: "Jun 2024 - Present",
        current: true,
        points: [
          "Extended security analysis across AWS and Azure to cover multiple cloud components, improving attack surface visibility and architectural insights.",
          "Reduced account discovery time by 65% on AWS and 25% on Azure by optimizing backend workflows for scanning and assessment.",
          "Implemented backend modules in Go with gRPC, including asset filtering and minimum-cut analysis for more targeted insights.",
        ],
      },
      {
        title: "Software Developer Intern",
        duration: "Jan 2023 - Mar 2024",
        current: false,
        points: [
          "Built a comprehensive network reachability testing framework supporting custom dummy graphs to simulate 45+ scenarios.",
          "Enabled AWS EKS support for pod-to-pod and internet reachability analysis; leveraged Python and SAT solver for deeper insights.",
          "Enhanced attack chain analysis with application-layer misconfiguration scanning to uncover exploitable paths.",
        ],
      },
    ],
  },
  {
    name: "Upwork",
    url: "https://upwork.com",
    positions: [
      {
        title: "Freelance Software Developer",
        duration: "May 2021 - Dec 2022",
        current: false,
        points: [
          "Delivered 15+ client projects with consistent 100% satisfaction via strong execution and project management.",
          "Led a 1.5-year engagement to build a trading bot for Binance and Interactive Brokers with live data analysis, order handling, portfolio tracking, and a Next.js monitoring dashboard.",
          "Owned end-to-end delivery: requirements, debugging, logging, and DevOps (deploying/maintaining Linux VMs).",
        ],
      },
    ],
  },
];

export const footerLinks = [
  { text: "LinkedIn", url: "https://linkedin.com/in/yashagw" },
  { text: "GitHub", url: "https://github.com/yashagw" },
  { text: "RSS", url: "/rss.xml" },
];
