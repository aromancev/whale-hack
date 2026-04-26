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
const AiEnrichResponseSchema = EnrichSchema.partial().extend({
    is_cat: z.boolean(),
})
const EnrichJSONSchema = JSON.stringify(z.toJSONSchema(EnrichSchema), null, 2);
const AiEnrichResponseJSONSchema = JSON.stringify(z.toJSONSchema(AiEnrichResponseSchema), null, 2);

export type CatEnrich = z.infer<typeof EnrichSchema>;

export class NonCatImageError extends Error {
    constructor() {
        super("Uploaded image does not contain a cat.");
        this.name = "NonCatImageError";
    }
}

export class CatEnricher {
    constructor(
        private readonly ai: AiCapabilities
    ) { }

    async enrichFromImage(base64Image: string): Promise<CatEnrich> {
        const prompt = `
You are helping identify a found cat from an uploaded image.

First decide whether the image clearly contains a real cat. Only cats should be recognized and parsed.

If there is no visible cat, or the subject is a dog, another animal, a person, an object, a drawing, or an unclear image, respond with {"is_cat":false} and no cat details.

If the image clearly contains a cat, respond with {"is_cat":true,...cat details} and fill in as much of the cat schema as possible from the image.

Schema: ${EnrichJSONSchema}.

Full response schema: ${AiEnrichResponseJSONSchema}.

Breed group should always match the breed. Here is the mapping: ${JSON.stringify(CAT_BREEDS_BY_GROUP)}

Respond only with valid JSON according to the schema and nothing else.
`
        const response = await this.ai.recognizeImage({
            base64Image,
            prompt,
        })

        const parsedResponse = AiEnrichResponseSchema.parse(JSON.parse(stripJsonFence(response.text)))

        if (!parsedResponse.is_cat) {
            throw new NonCatImageError();
        }

        return EnrichSchema.parse(parsedResponse)
    }
}

function stripJsonFence(text: string) {
    return text.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
}
