import { uploadFileSetup } from "./uploadFile/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { getFilesSetup } from "./getFiles/mod.ts";
import { updateSetup } from "./update/mod.ts";

export const fileSetup = () => {
  uploadFileSetup();
  getSetup();
  getsSetup();
  getFilesSetup();
  updateSetup();
};
