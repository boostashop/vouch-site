import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import PublicProfilePage from "@/app/u/[slug]/page"

interface CustomDomainPageProps {
  params: Promise<{ host: string }>
}

export async function generateMetadata({ params }: CustomDomainPageProps): Promise<Metadata> {
  const { host } = await params
  const user = await prisma.user.findFirst({
    where: { customDomain: host },
    select: { name: true, profileMetaTitle: true, profileMetaDescription: true },
  })
  if (!user) return { title: "Profile Not Found" }
  return {
    title: user.profileMetaTitle || `${user.name || "User"}'s Vouch Profile | Vouched.to`,
    description: user.profileMetaDescription || `View verified vouches and reputation for ${user.name || "this user"} on Vouched.to.`,
  }
}

export default async function CustomDomainPage({ params }: CustomDomainPageProps) {
  const { host } = await params

  const user = await prisma.user.findFirst({
    where: { customDomain: host },
    select: { slug: true },
  })

  if (!user?.slug) notFound()

  return <PublicProfilePage params={Promise.resolve({ slug: user.slug })} />
}
