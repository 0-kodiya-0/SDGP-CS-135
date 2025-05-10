import { LayoutGrid, Workflow, Users, Bot, Puzzle, Lock } from "lucide-react";

const features = [
    {
        title: "Customizable Workspaces",
        description: "Create and customize multiple environments for different workflows and projects",
        icon: <LayoutGrid size={24} />,
    },
    {
        title: "Workflow Integration",
        description: "Seamlessly connect with organizations and manage tasks across environments",
        icon: <Workflow size={24} />,
    },
    {
        title: "Real-time Collaboration",
        description: "Work together with team members through integrated chat, voice, and video calls",
        icon: <Users size={24} />,
    },
    {
        title: "AI-Powered Features",
        description: "Enhanced productivity with AI-driven content analysis and assistance",
        icon: <Bot size={24} />,
    },
    {
        title: "Secure Environment",
        description: "End-to-end encryption and isolated workspaces for maximum security",
        icon: <Lock size={24} />,
    },
    {
        title: "Third-party Integration",
        description: "Connect with your favorite tools and services seamlessly",
        icon: <Puzzle size={24} />,
    },
];

export default features;