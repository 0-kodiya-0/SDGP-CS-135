import { cn } from "@/lib/utils";
import Image from "next/image";

import { Linkedin, Github, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { TeamMember } from "./about.types";

interface TeamMemberMarqueeCardProps {
  member: TeamMember;
}

export function TeamMemberMarqueeCard({ member }: TeamMemberMarqueeCardProps) {
  return (
    <div
      className={cn(
        "relative h-80 w-72 cursor-pointer overflow-hidden rounded-xl border p-6 mx-3",
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05] transition-colors",
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="relative h-32 w-32 overflow-hidden rounded-full mb-4">
          <Image
            src={member.image}
            alt={`Photo of ${member.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 128px, 128px"
          />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold dark:text-white">
            {member.name}
          </h3>
          <p className="text-sm font-medium text-gray-500 dark:text-white/40">{member.role}</p>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 text-center">
        <span className="font-medium">Specialty:</span> {member.specialty}
      </div>
      
      <div className="flex justify-center gap-4 mt-5">
        <motion.a 
          href={member.linkedin} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          whileHover={{ scale: 1.1 }}
        >
          <Linkedin className="h-5 w-5" />
        </motion.a>
        <motion.a 
          href={member.github} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
          whileHover={{ scale: 1.1 }}
        >
          <Github className="h-5 w-5" />
        </motion.a>
        <motion.a 
          href={member.email}
          className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400"
          whileHover={{ scale: 1.1 }}
        >
          <Mail className="h-5 w-5" />
        </motion.a>
      </div>
    </div>
  );
}