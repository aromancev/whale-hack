import { CAT_BREEDS_BY_GROUP, CatSchema } from "@/domain/cats";
import { AiCapabilities } from "@/platform/ai";
import z from "zod";


export const EnrichSchema = CatSchema.pick({
    breed: true,
    breed_group: true,
    color: true,
    unique_details: true,
    age_group: true,
    collar: true,
    size: true,
})
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

Breed group should always match the breed. Here is the mapping: ${JSON.stringify(CAT_BREEDS_BY_GROUP)}

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
