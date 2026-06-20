import { type ActFn, ObjectId } from "lesan";
import { file } from "../../../mod.ts";

export const getFilesFn: ActFn = async (body) => {
  const {
    set: { _ids },
    get,
  } = body.details;

  return await file
    .aggregation({
      pipeline: [
        {
          $match: {
            _id: { $in: (_ids as string[]).map((id) => new ObjectId(id)) },
          },
        },
      ],
      projection: get,
    })
    .toArray();
};
