import { Marquee } from "@/components/magicui/marquee";
import { teamMembers } from "./about.data";
import { SectionTitle } from "./SectionTitle";
import { TeamMemberMarqueeCard } from "./TeamMemberMarqueeCard";

export function TeamMarquee() {
  return (
    <section className="mb-20">
      <SectionTitle title="Meet Our Team" />
      
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-4">
        <Marquee pauseOnHover className="[--duration:30s]">
          {teamMembers.map((member, index) => (
            <TeamMemberMarqueeCard key={index} member={member} />
          ))}
        </Marquee>
        
        {/* Gradient overlays for smooth edge fading */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background"></div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background"></div>
      </div>
    </section>
  );
}