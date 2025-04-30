import { Marquee } from "@/components/magicui/marquee"
import ContentContainer from "@/layouts/ContentContainer"
import { ny } from "@/lib/utils"
import Image from "next/image"
import { Star, Quote } from "lucide-react"
import Link from "next/link"

const reviews = [
    {
        name: "Jack Thompson",
        role: "Software Engineer",
        username: "@jack",
        body: "The interface is incredibly intuitive. I've streamlined my workflow significantly since starting to use it.",
        rating: 5,
        img: "https://avatar.vercel.sh/jack",
        link: "https://github.com/username/fusionspace/discussions/1"
    },
    {
        name: "Sarah Chen",
        role: "Product Designer",
        username: "@sarah_designs",
        body: "The customization options are exactly what I needed. It's transformed how I manage my projects.",
        rating: 5,
        img: "https://avatar.vercel.sh/sarah",
        link: "https://github.com/username/fusionspace/discussions/2"
    },
    {
        name: "Michael Rodriguez",
        role: "Full Stack Developer",
        username: "@mike_codes",
        body: "The integration capabilities are outstanding. Finally, a solution that works seamlessly with all my tools.",
        rating: 4,
        img: "https://avatar.vercel.sh/mike",
        link: "https://github.com/username/fusionspace/discussions/3"
    },
    {
        name: "Emma Wilson",
        role: "UX Researcher",
        username: "@emma_ux",
        body: "The attention to detail in the user experience is remarkable. It's clearly built with users in mind.",
        rating: 5,
        img: "https://avatar.vercel.sh/emma",
        link: "https://github.com/username/fusionspace/discussions/4"
    },
    {
        name: "David Park",
        role: "Product Manager",
        username: "@dave_pm",
        body: "Game-changing productivity features. This has become an essential part of my daily workflow.",
        rating: 5,
        img: "https://avatar.vercel.sh/david",
        link: "https://github.com/username/fusionspace/discussions/5"
    },
    {
        name: "Lisa Kumar",
        role: "Technical Lead",
        username: "@lisa_tech",
        body: "The performance is impressive. Even with complex workflows, everything runs smoothly.",
        rating: 5,
        img: "https://avatar.vercel.sh/lisa",
        link: "https://github.com/username/fusionspace/discussions/6"
    },
]

const firstRow = reviews.slice(0, reviews.length / 2)
const secondRow = reviews.slice(reviews.length / 2)

function ReviewCard({
    img,
    name,
    role,
    username,
    body,
    rating,
    link
}: {
    img: string
    name: string
    role: string
    username: string
    body: string
    rating: number
    link: string
}) {
    return (
        <Link href={link} target="_blank" rel="noopener noreferrer">
            <figure
                className={ny(
                    "group relative w-80 cursor-pointer overflow-hidden rounded-xl border p-6 transition-all duration-300",
                    // light styles
                    "border-gray-950/[.1] bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-lg hover:shadow-gray-200/50",
                    // dark styles
                    "dark:border-gray-50/[.1] dark:bg-gray-900/80 dark:backdrop-blur-sm dark:hover:bg-gray-900 dark:hover:shadow-lg dark:hover:shadow-gray-900/50",
                )}
            >
                <Quote className="absolute right-4 top-4 h-6 w-6 text-blue-accent/20" />

                <div className="flex flex-row items-center gap-3">
                    <Image
                        className="rounded-full transition-transform duration-300 group-hover:scale-110"
                        width="48"
                        height="48"
                        alt={`${name}'s avatar`}
                        src={img}
                    />
                    <div className="flex flex-col">
                        <figcaption className="font-semibold text-gray-900 dark:text-white">
                            {name}
                        </figcaption>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {role}
                        </p>
                        <p className="text-xs text-blue-accent">
                            {username}
                        </p>
                    </div>
                </div>

                <div className="mt-2 flex gap-0.5">
                    {Array.from({ length: rating }).map((_, i) => (
                        <Star
                            key={i}
                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                        />
                    ))}
                </div>

                <blockquote className="mt-3 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {body}
                </blockquote>

                <div className="absolute -left-2 -top-2 h-24 w-24 rounded-full bg-blue-accent/5 blur-2xl" />
                <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-blue-accent/5 blur-2xl" />
            </figure>
        </Link>
    )
}

function Reviews() {
    return (
        <ContentContainer className="py-12 md:py-16 lg:py-24">
            {/* Title and Description Section */}
            <div className="mx-auto mb-16 max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Trusted by Developers Worldwide
                </h2>
                <div className="relative">
                    <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-accent/10 blur-3xl" />
                    <p className="relative mt-4 text-lg leading-8 text-gray-600 dark:text-gray-400">
                        {`Discover why thousands of developers choose our platform for their daily workflow.
                            Here's what our community has to say about their experience.`}
                    </p>
                </div>
            </div>

            {/* Reviews Marquee Section */}
            <div className="relative flex size-full flex-col items-center justify-center overflow-hidden">
                <Marquee
                    pauseOnHover
                    className="[--duration:30s] [--gap:2rem]"
                >
                    {firstRow.map((review) => (
                        <ReviewCard key={review.username} {...review} />
                    ))}
                </Marquee>
                <Marquee
                    reverse
                    pauseOnHover
                    className="mt-8 [--duration:30s] [--gap:2rem]"
                >
                    {secondRow.map((review) => (
                        <ReviewCard key={review.username} {...review} />
                    ))}
                </Marquee>

                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background" />
            </div>
        </ContentContainer>
    )
}

export default Reviews;