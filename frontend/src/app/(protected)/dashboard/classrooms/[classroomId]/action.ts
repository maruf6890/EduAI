import { private_api_call } from "@/actions/private_api_call";


export const getClassroomDetails = async (classroomId: string) => {
  try {
        const res = await private_api_call({
         path: `classrooms/${classroomId}`,
         method: "GET",
       });
       if(res.success) {
         return res.data;
       } else {
        return null;
      }
    } catch (error) {
    console.error("Error fetching classroom details:", error);
      return null;
    }
  } 