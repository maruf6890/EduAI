import os
from typing import List, Optional, Type, TypeVar
from google import genai
from google.genai import types
from google.genai.errors import APIError 
from loguru import logger
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
load_dotenv()  


T = TypeVar('T', bound=BaseModel)
GEMINI_BASE_IMAGE_MODEL = "gemini-2.5-flash"
GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY")


class GeminiServiceError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        original_error: Exception | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.original_error = original_error
        super().__init__(message)



def text_to_text(
    input_text: str,
    system_prompt: Optional[str] = None,
    user_prompt: Optional[str] = None,
    must_include: Optional[List[str]] = None,
    must_exclude: Optional[List[str]] = None,
    api_key: Optional[str] = None,
    model: str = "gemini-2.5-flash",
    output_format: Optional[Type[T]] = None,
) -> Optional[T]:
    
    try:
        client = genai.Client(api_key=api_key)
        prompt = user_prompt or ""

        prompt += f"""

        Input:
        {input_text}
        """


        if must_include:
            prompt += f"""

            Must include:
            {", ".join(must_include)}
            """


        if must_exclude:
            prompt += f"""

        Must avoid:
        {", ".join(must_exclude)}
        """


        config_kwargs = {
            "system_instruction": system_prompt,
        }


        if output_format:
            config_kwargs["response_mime_type"] = "application/json"
            config_kwargs["response_schema"] = output_format


        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                **config_kwargs
            )
        )


        if not response.text:
            logger.error("Gemini returned an empty response.")
            raise GeminiServiceError(
                message="Our Support System is currently experiencing High Volume, Please try again later.",
                status_code=500,
                original_error=Exception("Empty response from Gemini")
            )

        if output_format:
            return output_format.model_validate_json(response.text)

        return response.text
    except ValidationError as e:
        logger.exception("Failed to parse Gemini response.")

        raise GeminiServiceError(
            message="Our Support System is currently experiencing High Volume, Please try again later.",
            original_error=e,
            status_code=500
        )

    except APIError as e:
        logger.error(f"API Error occurred: {e}")
        raise GeminiServiceError(message="Our Support System is currently experiencing High Volume, Please try again later.", status_code=500, original_error=e)
    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}")
        raise GeminiServiceError(message="Our Support System is currently experiencing High Volume, Please try again later.", status_code=500, original_error=e)

