import { type ActFn, Infer, object, ObjectId } from "lesan";
import { processStep } from "../../../mod.ts";
import { processStep_pure } from "../../../models/processStep.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: {
      _id,
      name,
      description,
      stepType,
      order,
      required,
      groupsOperator,
      assigneeGroups,
    },
    get,
  } = body.details;

  const pureStruct = object(processStep_pure);
  const updateObj: Partial<Infer<typeof pureStruct>> = {
    updatedAt: new Date(),
    ...(name !== undefined && { name }),
    ...(description !== undefined && { description }),
    ...(stepType !== undefined && { stepType }),
    ...(order !== undefined && { order }),
    ...(required !== undefined && { required }),
    ...(groupsOperator !== undefined && { groupsOperator }),
    ...(assigneeGroups !== undefined && { assigneeGroups }),
  };

  return await processStep.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: updateObj,
    },
    projection: get,
  });
};
