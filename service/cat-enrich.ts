import { PetSchema } from "@/domain/pets";
import { AiCapabilities } from "@/platform/ai";
import z from "zod";


export const EnrichSchema = PetSchema.pick({ color: true, description: true })
const EnrichJSONSchema = JSON.stringify(z.toJSONSchema(EnrichSchema), null, 2);

export type CatEnrich = z.infer<typeof EnrichSchema>;

export class CatEnricher {
    constructor(
        private readonly ai: AiCapabilities
    ) { }

    async enrichFromImage(base64Image: string): Promise<CatEnrich> {
        const prompt = `
You are helping identify a lost pet from an uploaded image.

Fill in as much of the schema as possible from the image. 

Schema: ${EnrichJSONSchema}.

Respond only with valid JSON according to the schema and nothing else.
        `
        const response = await this.ai.recognizeImage({
            base64Image,
            mediaType: "image/jpeg",
            prompt,
        })

        return EnrichSchema.parse(JSON.parse(stripJsonFence(response.text)))
    }
}

function stripJsonFence(text: string) {
    return text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
}
