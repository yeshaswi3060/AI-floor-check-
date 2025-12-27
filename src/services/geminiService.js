/**
 * AI Vision Service for Floor Plan Analysis
 * Uses OpenRouter API with Gemini 2.0 Flash to detect rooms in floor plans
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Analyze a floor plan image using AI to detect rooms
 * @param {string} imageBase64 - Base64 encoded image data (with or without the data:image prefix)
 * @param {string} mimeType - Image MIME type (e.g., 'image/png', 'image/jpeg')
 * @returns {Promise<Object>} - Analysis results with detected rooms
 */
export async function analyzeFloorPlan(imageBase64, mimeType = 'image/png') {
    if (!OPENROUTER_API_KEY) {
        throw new Error('OpenRouter API key not configured. Please add VITE_OPENROUTER_API_KEY to your .env file.');
    }

    // Ensure proper data URL format
    let imageUrl = imageBase64;
    if (!imageBase64.startsWith('data:')) {
        imageUrl = `data:${mimeType};base64,${imageBase64}`;
    }

    const prompt = `You are an expert floor plan analyzer with excellent spatial awareness. Analyze this floor plan image VERY CAREFULLY.

TASK: Identify ALL rooms and areas in this floor plan and provide their EXACT positions.

For EACH room you find:
1. Room type: Bedroom, Master Bedroom, Kitchen, Bathroom, Toilet, Living Room, Dining Room, Balcony, Hall, Corridor, Study, Pooja Room, Store Room, Utility, Terrace, Entrance, Drawing Room, etc.

2. EXACT CENTER POSITION as percentages (this is CRITICAL - be VERY PRECISE):
   - x: horizontal position (0 = left edge, 50 = center, 100 = right edge)
   - y: vertical position (0 = top edge, 50 = center, 100 = bottom edge)
   
   EXAMPLE: If a room is in the top-left corner, x might be 15-25, y might be 15-25
   EXAMPLE: If a room is in the bottom-right corner, x might be 75-85, y might be 75-85
   EXAMPLE: If a room is in the center, x and y would be around 45-55

3. Size: small, medium, or large

INSTRUCTIONS:
- Look at EACH room's ACTUAL position in the image
- Measure where the CENTER of each room would be
- Give PRECISE x,y percentages (not approximate)
- Include ALL rooms you can see, even small ones like toilets and balconies
- If you see labels/text on rooms, use those to identify room types

Respond with ONLY valid JSON:
{
    "rooms": [
        {"type": "Master Bedroom", "x": 20, "y": 30, "size": "large"},
        {"type": "Kitchen", "x": 75, "y": 25, "size": "medium"},
        {"type": "Toilet", "x": 85, "y": 40, "size": "small"}
    ],
    "totalRooms": 3,
    "floorPlanType": "apartment",
    "additionalNotes": "observations"
}`;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Vastu Analise'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 4096,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter Error:', errorData);
            throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Extract the text response
        const textResponse = data.choices?.[0]?.message?.content;

        if (!textResponse) {
            throw new Error('No response received from AI');
        }

        console.log('AI Response:', textResponse);

        // Parse the JSON response - extract JSON from markdown if needed
        let jsonStr = textResponse;

        // Remove markdown code blocks if present
        const jsonMatch = textResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        } else {
            // Try to find raw JSON
            const rawJsonMatch = textResponse.match(/\{[\s\S]*\}/);
            if (rawJsonMatch) {
                jsonStr = rawJsonMatch[0];
            }
        }

        const analysisResult = JSON.parse(jsonStr);

        // Ensure totalRooms is set
        if (!analysisResult.totalRooms && analysisResult.rooms) {
            analysisResult.totalRooms = analysisResult.rooms.length;
        }

        return analysisResult;

    } catch (error) {
        console.error('AI Analysis Error:', error);
        throw error;
    }
}

/**
 * Check if AI API is configured
 * @returns {boolean}
 */
export function isGeminiConfigured() {
    return !!OPENROUTER_API_KEY;
}
