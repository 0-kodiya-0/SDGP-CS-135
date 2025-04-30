import { TeamMember, TimelineItem } from './about.types';
export const timelineData: TimelineItem[] = [
  {
    phase: "Planning Phase",
    date: "Completed (05/04/2024)",
    content: "Initial research, defining project scope, and setting milestones. Requirements gathering and brainstorming sessions to ensure feasibility.",
    status: "completed",
    position: "right"
  },
  {
    phase: "Design Phase",
    date: "Completed (10/04/2024)",
    content: "UI/UX wireframing, prototyping, and refining the user experience to ensure an intuitive design.",
    status: "completed",
    position: "left"
  },
  {
    phase: "Development Phase",
    date: "In Progress",
    content: "Active coding, feature implementation, and system integrations. Testing and debugging in real-time.",
    status: "current",
    position: "right"
  },
  {
    phase: "Testing & QA",
    date: "Upcoming",
    content: "Comprehensive testing of features, performance checks, and bug fixes to ensure system reliability.",
    status: "upcoming",
    position: "left"
  },
  {
    phase: "Deployment & Launch",
    date: "Scheduled (05/10/2024)",
    content: "Deploying the application to production, final security checks, and post-launch support.",
    status: "upcoming",
    position: "right"
  },
  {
    phase: "Project Completion",
    date: "Finalized",
    content: "",
    status: "upcoming",
    position: "center"
  }
];

//members




export const teamMembers: TeamMember[] = [
  {
    name: "Channa Laksen Karawita",
    role: "Project Lead & Scrum Master",
    id: "20232310",
    specialty: "Backend Development",
    linkedin: "https://www.linkedin.com/in/channa-karawita-5a2924211/",
    github: "https://github.com/channa-karawita",
    email: "mailto:channa.20232310@iit.ac.lk",
    image: "/team/channa.jpeg"
    
  },
  {
    name: "P.V. Didula Muthumal",
    role: "Frontend Developer",
    id: "20222096",
    specialty: "UI/UX Design",
    linkedin: "https://www.linkedin.com/in/didula-muthumal-6455222ab/",
    github: "https://github.com/didula-muthumal",
    email: "mailto:didula.20222096@iit.ac.lk",
    image: "/team/didula.jpeg"
  },
  {
    name: "J.A.D.S.N Jayakody",
    role: "Product Owner & Developer",
    id: "20222284",
    specialty: "System Architecture",
    linkedin: "https://www.linkedin.com/in/sanithu-jayakody-a541142ab/",
    github: "https://github.com/0-kodiya-0",
    email: "mailto:sanithu.20222284@iit.ac.lk",
    image: "/team/sanithu.jpeg"
  },
  {
    name: "Don Kehan Hasnaka Liyanage",
    role: "Developer",
    id: "20222087",
    specialty: "API Integration",
    linkedin: "https://linkedin.com/in/kehan-liyanage",
    github: "https://github.com/SYR3X",
    email: "mailto:kehan.20222087@iit.ac.lk",
    image: "/team/kehan.jpeg"
  },
  {
    name: "Thihan Jinajith Ranwella",
    role: "Developer",
    id: "20222265",
    specialty: "Database Design",
    linkedin: "https://www.linkedin.com/in/thihanjr/",
    github: "https://github.com/Thihanjr",
    email: "mailto:thihan.20222265@iit.ac.lk",
    image: "https://avatar.vercel.sh/thihan"
  },
  {
    name: "Piumal Gunathilaka",
    role: "Developer",
    id: "20222440",
    specialty: "Testing & QA",
    linkedin: "https://www.linkedin.com/in/piumal-gunathilaka-38152b2b8/",
    github: "https://github.com/PiumalGunathilaka20222440",
    email: "mailto:piumal.20222440@iit.ac.lk",
    image: "https://avatar.vercel.sh/piumal"
  }
];
