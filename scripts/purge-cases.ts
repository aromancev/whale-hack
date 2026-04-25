import { createClient } from "redis"

const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379"
const caseKeyPattern = "pet-cases:*"

async function main() {
  const client = createClient({ url: redisUrl })

  client.on("error", (error) => {
    console.error("Redis client error", error)
  })

  await client.connect()

  try {
    const keys = await client.keys(caseKeyPattern)

    if (keys.length === 0) {
      console.log(`No keys matched ${caseKeyPattern}`)
      return
    }

    await client.del(keys)
    console.log(`Deleted ${keys.length} Redis keys matching ${caseKeyPattern}`)
  } finally {
    await client.quit()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
