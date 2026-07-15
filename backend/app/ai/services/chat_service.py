

import json
from venv import logger

from app.schemas.chat_schema import ChatServiceReq
from app.ai.services.validate_query import validate_query
from app.ai.services.rag_services import llm_query_for_rag_pipeline
from app.ai.agents.panner_agent import generate_learning_plan
from app.ai.agents.tool_calling_agent import run_calendar_agent
from app.ai.utils.llm import text_to_text
from app.ai.agents.quiz_agent import generate_and_save_quiz


def ChatService(conn, chatData:ChatServiceReq):
    result = validate_query(
            query=chatData.question,
            role=chatData.role,
            conn=conn,
            session_id=chatData.session_id
    )
    if(result==None):
        return {
            "message": "Something went wrong please try again later",
            "route_used": None

            
        }

    print("Route:", result.route)
    print("Refined Query:", result.refined_query)
    print("improper:", result.improper_query)
    print("Reason:", result.why_improper)
    refined_query=result.refined_query
    route=result.route
    improper=result.improper_query
    reason=result.why_improper

    if(improper):
       return {
           "message" :reason
       }
    
    if(route=="rag"):
        result = llm_query_for_rag_pipeline(
        query=refined_query,
        classroom_id=chatData.classroom_id,
        user_id=chatData.user_id
        )


        print("\nANSWER:")
        print(result.answer)


        print("\nSources:")
        print(result.sources)


        print("\nWeb fallback:")
        print(result.used_web_fallback)

        return {
            "message":result.answer,
            "route_used":"rag"
                }
    elif route=="planning":
        result = generate_learning_plan(
            topic=refined_query,
            max_attempts=3
        )

        print("\nAttempts:", result.attempts)

        if result.final_plan:
            print("\nGenerated Plan:")
            print(json.dumps(
                result.final_plan,
                indent=2
            ))

            # Extra checking
            flow = result.final_plan["flow"]

            print("\nNodes:")
            for node in flow["nodes"]:
                print(
                    f"- {node['id']} | "
                    f"{node['type']} | "
                    f"{node['data']['label']}"
                )

            print("\nEdges:")
            for edge in flow["edges"]:
                print(
                    f"- {edge['source']} -> {edge['target']}"
                )

            return{
                "message": "Your Plan Is Given Below",
                "tool_result": result.final_plan,
                "route_used":"planning"
                
            }

        else:
            print("\nFAILED:")
            print(result.failure_reason)
            return {
                "message": "Something went wrong please try again later",
                "route_used":"planning"
            }
    elif route=="tools":
        response = run_calendar_agent(
            conn=conn,
            user_id=chatData.user_id,
            classroom_id=chatData.classroom_id,
            session_id=chatData.session_id,
            user_query=refined_query
        )
        print(response)
        return {
            "message":response,
            "route_used":"tools"
        }
    elif route=="quiz":
        # title: Optional[str] = None
        # description: Optional[str] = None
        # questions: Optional[List[Dict[str, Any]]] = None
        # quiz_id: Optional[int] = None
        # saved: bool = False
        # attempts: int = 0
        # failure_reason: Optional[str] = None
        result= generate_and_save_quiz(conn=conn,classroom_id=chatData.classroom_id,topic_scope=refined_query,created_by=chatData.user_id);
        if(result.saved):
            return {
                "message": "Quiz created successfully",
                "route_used":"quiz",
                "tool_result": {
                    "quiz_id": result.quiz_id,
                }
            }
        else:
            logger.error(f"Failed to create quiz: {result.failure_reason}")
            return {
                "message": "Something went wrong please try again later",
                "route_used":"quiz"
            }
    else :
        response= text_to_text(
            input_text=refined_query,
            system_prompt="You are a supportive agent"
        )
        return {
            "message":response,
            "route_used":"chat"
        }


    


    
    