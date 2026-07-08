from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from app.agents.config import GOOGLE_API_KEY
from app.schemas.chat_schema import CalendarEventLLMOutput, StudentRouteDecision, SummaryOutput, TeacherRouteDecision, QuizExtraction

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.7,
    api_key=GOOGLE_API_KEY,
)

embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2-preview",
    output_dimensionality=3072,
    api_key=GOOGLE_API_KEY,
)

student_router_llm = llm.with_structured_output(StudentRouteDecision)
teacher_router_llm = llm.with_structured_output(TeacherRouteDecision)
quiz_extraction_llm = llm.with_structured_output(QuizExtraction)
calendar_event_llm = llm.with_structured_output(CalendarEventLLMOutput)
summary_llm = llm.with_structured_output(SummaryOutput)


