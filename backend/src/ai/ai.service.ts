import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';

export interface ParsedFoodItem {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
 
  icon: string;
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

const ANALYZE_IMAGE_SYSTEM_INSTRUCTION =
  "Eres un nutricionista experto en cocina latinoamericana y mexicana con capacidad de análisis visual. " +
  "Analiza la foto del plato o comida que te muestran. Identifica CADA alimento o ingrediente visible por separado. " +
  "Estima porciones realistas basándote en el tamaño visual del plato y los alimentos. " +
  "Calcula calorías y macronutrientes para cada alimento individualmente. " +
  "Si no puedes identificar un alimento claramente, haz tu mejor estimación e indícalo en el nombre. " +
  "Solo responde con el array JSON solicitado, sin explicaciones adicionales.";

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
                icon: {
                  type: Type.STRING,
                  description: 'Un nombre de icono válido de Ionicons representativo del alimento (ej: restaurant, fast-food, nutrition, pizza, fish, egg, water, cafe, etc.).',
                },
              },
              required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat', 'icon'],
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
  async getCoachAdvice(profile: any, meals: any[], weeklyHistory?: any[]): Promise<string> {
    if (!this.ai) {
      throw new BadRequestException('MISSING_API_KEY');
    }

    let prompt = `Perfil del usuario: ${JSON.stringify(profile)}\n`;
    prompt += `Comidas de hoy: ${JSON.stringify(meals)}\n`;
    
    if (weeklyHistory && weeklyHistory.length > 0) {
      prompt += `Historial de los últimos 7 días: ${JSON.stringify(weeklyHistory)}\n`;
      prompt += `Por favor, analiza mi progreso considerando el historial semanal. Detecta patrones (ej. consistencia, días sin registrar, tendencia calórica o de proteínas). Dame un resumen corto y conciso en formato Markdown (usa **negritas** y listas), destacando lo positivo y dando 1 consejo accionable.`;
    } else {
      prompt += `Por favor, dame un análisis corto y conciso en formato Markdown de cómo voy hoy y qué me recomiendas hacer en lo que resta del día.`;
    }

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

  /**
   * Analiza una imagen de comida y devuelve los alimentos detectados con macros.
   */
  async analyzeImage(base64Image: string, mealType?: string): Promise<ParsedFoodItem[]> {
    if (!this.ai) {
      throw new BadRequestException('MISSING_API_KEY');
    }

    if (!base64Image || base64Image.length < 100) {
      throw new BadRequestException('La imagen es inválida o está vacía');
    }

    // Strip data URI prefix if present (e.g. "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const contextHint = mealType ? ` Este es un plato de ${mealType}.` : '';

    let response;
    try {
      response = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: `Analiza esta foto de comida.${contextHint} Identifica CADA alimento visible por separado. Estima porciones realistas basándote en lo que ves y calcula calorías y macronutrientes para cada uno.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: 'Lista de alimentos detectados en la imagen',
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'Nombre descriptivo del alimento en español',
                },
                portion: {
                  type: Type.STRING,
                  description: 'Porción estimada visualmente (ej: 1 plato, 150g, 2 piezas)',
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
                icon: {
                  type: Type.STRING,
                  description: 'Un nombre de icono válido de Ionicons representativo del alimento (ej: restaurant, fast-food, nutrition, pizza, fish, egg, water, cafe, etc.).',
                },
              },
              required: ['name', 'portion', 'calories', 'protein', 'carbs', 'fat', 'icon'],
            },
          },
          systemInstruction: ANALYZE_IMAGE_SYSTEM_INSTRUCTION,
        },
      });
    } catch (apiError: any) {
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
}
