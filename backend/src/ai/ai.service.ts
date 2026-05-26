import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

export interface ParsedFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
}

// --- CONFIGURACIÓN IA (Inspirada en el modelo propuesto) ---
const GEMINI_MODEL = 'gemini-2.5-flash';

const PARSE_MEAL_SYSTEM_INSTRUCTION = 
  "Eres un nutricionista experto en cocina latinoamericana y mexicana. " +
  "Analiza la comida descrita por el usuario y desglosa CADA INGREDIENTE O PLATILLO por separado con sus calorías y macronutrientes. " +
  "Sé realista con las porciones típicas. " +
  "Si el usuario menciona varios alimentos juntos, sepáralos en items individuales. " +
  "Solo responde con el array JSON solicitado, sin explicaciones adicionales.";

const QNA_SYSTEM_INSTRUCTION = 
  "Actúa como un nutricionista personal amigable y experto. Tu objetivo es proporcionar consejos de alimentación, " +
  "responder preguntas sobre macros, déficit calórico y hábitos. Responde siempre de manera concisa y útil.";

@Injectable()
export class AiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'tu_api_key_aqui') {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  /**
   * Convierte texto libre de una comida en una lista estructurada de alimentos con macros.
   * Ej: "desayuné 2 huevos revueltos con jamón y un café con leche"
   */
  async parseMealText(text: string): Promise<ParsedFoodItem[]> {
    if (!this.ai) {
      throw new BadRequestException('MISSING_API_KEY');
    }

    if (!text || text.trim().length < 3) {
      throw new BadRequestException('El texto es demasiado corto');
    }

    let response;
    try {
      response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: `El usuario describe su comida así: "${text}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Lista de alimentos identificados en el texto',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'Nombre descriptivo del alimento en español',
                },
                portion: {
                  type: Type.STRING,
                  description: 'Porción estimada (ej: 2 piezas, 150g, 1 taza)',
                },
                calories: {
                  type: Type.INTEGER,
                  description: 'Calorías estimadas en kcal para esa porción',
                },
                protein: {
                  type: Type.INTEGER,
                  description: 'Gramos de proteína estimados',
                },
                carbs: {
                  type: Type.INTEGER,
                  description: 'Gramos de carbohidratos estimados',
                },
                fat: {
                  type: Type.INTEGER,
                  description: 'Gramos de grasa estimados',
                },
                emoji: {
                  type: Type.STRING,
                  description: 'Un emoji representativo del alimento (solo 1)',
                },
              },
              required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat', 'emoji'],
            },
          },
          systemInstruction: PARSE_MEAL_SYSTEM_INSTRUCTION,
        },
      });
    } catch (apiError: any) {
      // Catch Google GenAI SDK rate limits / API key errors
      const status = apiError.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = apiError.message || '';
      
      if (status === 429 || message.includes('Quota exceeded') || message.includes('rate-limits')) {
        throw new HttpException('RATE_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (status === 403 || message.includes('API key')) {
        throw new HttpException('INVALID_API_KEY', HttpStatus.FORBIDDEN);
      }
      throw new HttpException(
        message || 'Error de comunicación con el servicio de IA',
        status
      );
    }

    try {
      const parsed = JSON.parse(response.text || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      throw new BadRequestException('No se pudo interpretar la respuesta de la IA');
    }
  }

  /**
   * Analiza el estado diario del usuario y le da consejos.
   */
  async getCoachAdvice(profile: any, meals: any[]): Promise<string> {
    if (!this.ai) {
      throw new BadRequestException('MISSING_API_KEY');
    }

    let prompt = `Perfil del usuario: ${JSON.stringify(profile)}\n`;
    prompt += `Comidas de hoy: ${JSON.stringify(meals)}\n`;
    prompt += `Por favor, dame un análisis corto y conciso de cómo voy hoy y qué me recomiendas hacer en lo que resta del día.`;

    try {
      const response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction: QNA_SYSTEM_INSTRUCTION,
        },
      });
      return response.text || 'Sin consejos por el momento.';
    } catch (apiError: any) {
      const status = apiError.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = apiError.message || '';
      if (status === 429 || message.includes('Quota exceeded')) {
        throw new HttpException('RATE_LIMIT_EXCEEDED', HttpStatus.TOO_MANY_REQUESTS);
      }
      if (status === 403 || message.includes('API key')) {
        throw new HttpException('INVALID_API_KEY', HttpStatus.FORBIDDEN);
      }
      throw new HttpException('Error de comunicación con el servicio de IA', status);
    }
  }
}
