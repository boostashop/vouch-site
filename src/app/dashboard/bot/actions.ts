import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateBotToken(formData: FormData) {
  "use server"
  
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  const discordToken = formData.get("discordToken") as string
  const telegramToken = formData.get("telegramToken") as string
  
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      discordBotToken: discordToken || null,
      telegramBotToken: telegramToken || null,
    }
  })
  
  revalidatePath("/dashboard/bot")
  revalidatePath("/dashboard")
}
