import os
import requests
import json
import logging
from abc import ABC, abstractmethod

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("LLMClient")

class LLMClient(ABC):
    @abstractmethod
    def verify_complaint(self, title: str, description: str, category: str, file_urls: list) -> dict:
        """
        Verifies if the complaint is genuine and categorizes it.
        Returns a dict: {
            "is_genuine": bool,
            "confidence": float,
            "category": str,
            "summary": str,
            "suggested_action": str
        }
        """
        pass

class OllamaClient(LLMClient):
    def __init__(self, url: str, model: str):
        self.url = url
        self.model = model
        logger.info(f"Ollama Client initialized with url={url}, model={model}")

    def verify_complaint(self, title: str, description: str, category: str, file_urls: list) -> dict:
        prompt = f"""
        Analyze the following municipal complaint:
        Title: {title}
        Description: {description}
        Category: {category}
        Attachments: {', '.join(file_urls) if file_urls else 'None'}

        Determine if this complaint is genuine (i.e. is a real infrastructure, sanitation, or municipal issue, not spam/gibberish).
        Also classify the severity level based on risks to public safety, inconvenience, and urgency into exactly one of: "low", "medium", "high", or "highest".
        Also provide a short summary and suggested action.
        
        Respond ONLY in a valid JSON object matching the following structure:
        {{
            "is_genuine": true,
            "confidence": 0.85,
            "severity": "high",
            "category": "Road Encroachment",
            "summary": "Short 1-sentence summary of the issue.",
            "suggested_action": "Suggested next step for municipal workers."
        }}
        Do not include markdown or formatting, just raw JSON.
        """
        try:
            response = requests.post(
                f"{self.url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=15
            )
            if response.status_code == 200:
                result_text = response.json().get("response", "")
                data = json.loads(result_text)
                return {
                    "is_genuine": data.get("is_genuine", True),
                    "confidence": float(data.get("confidence", 0.8)),
                    "severity": data.get("severity", "medium").lower(),
                    "category": data.get("category", category),
                    "summary": data.get("summary", f"Seeded issue regarding {category}."),
                    "suggested_action": data.get("suggested_action", "Dispatch investigation team.")
                }
        except Exception as e:
            logger.error(f"Error calling Ollama: {str(e)}")
        
        # Fallback in case of failure
        return MockClient().verify_complaint(title, description, category, file_urls)

class GeminiClient(LLMClient):
    def __init__(self, api_key: str):
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Gemini API Client initialized.")

    def verify_complaint(self, title: str, description: str, category: str, file_urls: list) -> dict:
        prompt = f"""
        Analyze this municipal complaint:
        Title: {title}
        Description: {description}
        Category: {category}
        Attachments: {', '.join(file_urls) if file_urls else 'None'}

        Return a JSON object exactly conforming to this:
        {{
            "is_genuine": true/false,
            "confidence": float (0.0 to 1.0),
            "severity": "string (exactly 'low', 'medium', 'high', or 'highest' based on urgency and public risk)",
            "category": "string (the verified category)",
            "summary": "string (1 sentence summary)",
            "suggested_action": "string (suggested municipal inspection action)"
        }}
        Do not include any extra text or code block markers. Just the JSON.
        """
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            data = json.loads(text.strip())
            return {
                "is_genuine": data.get("is_genuine", True),
                "confidence": float(data.get("confidence", 0.9)),
                "severity": data.get("severity", "medium").lower(),
                "category": data.get("category", category),
                "summary": data.get("summary", f"Issue regarding {category}."),
                "suggested_action": data.get("suggested_action", "Send site investigator.")
            }
        except Exception as e:
            logger.error(f"Error calling Gemini: {str(e)}")
            return MockClient().verify_complaint(title, description, category, file_urls)

class OpenAIClient(LLMClient):
    def __init__(self, api_key: str):
        from openai import OpenAI
        self.client = OpenAI(api_key=api_key)
        logger.info("OpenAI Client initialized.")

    def verify_complaint(self, title: str, description: str, category: str, file_urls: list) -> dict:
        prompt = f"""
        Analyze this municipal complaint:
        Title: {title}
        Description: {description}
        Category: {category}
        Attachments: {file_urls}

        Determine if this complaint is genuine, assign a severity level (exactly one of 'low', 'medium', 'high', 'highest' based on urgency/safety risks), summarize it, and suggest an action.
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a municipal assistant. Respond in JSON with keys: is_genuine (boolean), confidence (float), severity (string), category (string), summary (string), suggested_action (string)."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            data = json.loads(content)
            return {
                "is_genuine": data.get("is_genuine", True),
                "confidence": float(data.get("confidence", 0.9)),
                "severity": data.get("severity", "medium").lower(),
                "category": data.get("category", category),
                "summary": data.get("summary", f"Issue regarding {category}."),
                "suggested_action": data.get("suggested_action", "Dispatch investigation team.")
            }
        except Exception as e:
            logger.error(f"Error calling OpenAI: {str(e)}")
            return MockClient().verify_complaint(title, description, category, file_urls)

class MockClient(LLMClient):
    def verify_complaint(self, title: str, description: str, category: str, file_urls: list) -> dict:
        logger.info("Mock Client called - AI verification skipped/disabled.")
        # Simple heuristic check: spam check
        is_genuine = True
        confidence = 0.95
        
        # Simple spam detector
        lowered = (title + " " + description).lower()
        if len(lowered.strip()) < 10 or "spam" in lowered or "test" in lowered or "abcd" in lowered:
            is_genuine = False
            confidence = 0.8
        
        # Heuristic severity classifier
        severity = "medium"
        if is_genuine:
            # High severity for critical public works/utilities
            if category in ["Sewerage & Drainage", "Water Supply leakage"]:
                severity = "high"
            
            # Check urgent keywords in description or title
            urgent_keywords = ["burst", "leak", "flood", "accident", "hazard", "danger", "falling", "injury", "broken wire", "open wire", "emergency"]
            if any(kw in lowered for kw in urgent_keywords):
                severity = "highest"
            elif len(lowered.strip()) < 30 and category not in ["Sewerage & Drainage", "Water Supply leakage"]:
                severity = "low"
        else:
            severity = "low"

        # Check files
        attachment_msg = f"with {len(file_urls)} attachment(s)" if file_urls else "without attachments"
        
        summary = f"Citizen reported {category}: '{title}' ({attachment_msg})."
        
        if is_genuine:
            suggested_action = f"Forward to Chief Officer for assignment to a {category} worker."
        else:
            suggested_action = "Reject or archive complaint as invalid/test request."

        return {
            "is_genuine": is_genuine,
            "confidence": confidence,
            "severity": severity,
            "category": category,
            "summary": summary,
            "suggested_action": suggested_action
        }

def get_llm_client(provider: str, config: dict) -> LLMClient:
    p = provider.lower()
    if p == "ollama":
        return OllamaClient(url=config.get("OLLAMA_URL"), model=config.get("OLLAMA_MODEL", "qwen"))
    elif p == "gemini" and config.get("GEMINI_API_KEY"):
        return GeminiClient(api_key=config.get("GEMINI_API_KEY"))
    elif p == "openai" and config.get("OPENAI_API_KEY"):
        return OpenAIClient(api_key=config.get("OPENAI_API_KEY"))
    else:
        # Default mock / disabled
        return MockClient()
