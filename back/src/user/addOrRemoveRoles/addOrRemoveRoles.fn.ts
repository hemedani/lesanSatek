import { type ActFn, ObjectId } from "lesan";
import { organization, store, unit, user } from "../../../mod.ts";

export const addOrRemoveRolesFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { _id, addRoles, removeRoles } = set;

  const userId = new ObjectId(_id as string);

  if (addRoles) {
    for (const role of addRoles as {
      roleId?: string;
      name: string;
      scopeType?: string;
      scopeId?: string;
    }[]) {
      const roleId = role.roleId || crypto.randomUUID();
      const roleEntry: Record<string, unknown> = {
        roleId,
        name: role.name,
      };
      if (role.scopeType) roleEntry.scopeType = role.scopeType;
      if (role.scopeId) roleEntry.scopeId = role.scopeId;

      if (role.scopeType === "unit" && role.scopeId) {
        const unitObjId = new ObjectId(role.scopeId);
        await user.addRelation({
          filters: { _id: userId },
          relations: {
            units: {
              _ids: [unitObjId],
              relatedRelations: {
                members: true,
              },
            },
          },
          projection: { _id: 1 },
        });
        const unitDoc = await unit.findOne({
          filters: { _id: unitObjId },
          projection: { organization: { _id: 1 } },
        });
        if (unitDoc?.organization) {
          const orgId = (unitDoc.organization as { _id: ObjectId })._id;
          await user.addRelation({
            filters: { _id: userId },
            relations: {
              organizations: {
                _ids: [new ObjectId(orgId)],
                relatedRelations: {
                  users: true,
                },
              },
            },
            projection: { _id: 1 },
          });
        }
      }

      if (role.scopeType === "organization" && role.scopeId) {
        const orgObjId = new ObjectId(role.scopeId);
        await user.addRelation({
          filters: { _id: userId },
          relations: {
            organizations: {
              _ids: [orgObjId],
              relatedRelations: {
                users: true,
              },
            },
          },
          projection: { _id: 1 },
        });
      }

      if (role.name === "UnitHead" && role.scopeId) {
        await unit.addRelation({
          filters: { _id: new ObjectId(role.scopeId) },
          relations: {
            head: {
              _ids: userId,
            },
          },
          projection: { _id: 1 },
          replace: true,
        });
      }

      if (role.name === "OrgHead" && role.scopeId) {
        await organization.addRelation({
          filters: { _id: new ObjectId(role.scopeId) },
          relations: {
            head: {
              _ids: userId,
            },
          },
          projection: { _id: 1 },
          replace: true,
        });
      }

      if (role.name === "StoreHead" && role.scopeId) {
        await store.addRelation({
          filters: { _id: new ObjectId(role.scopeId) },
          relations: {
            storeHead: {
              _ids: userId,
            },
          },
          projection: { _id: 1 },
          replace: true,
        });
      }

      await user.findOneAndUpdate({
        filter: {
          _id: userId,
          roles: {
            $not: {
              $elemMatch: {
                name: role.name,
                scopeType: role.scopeType,
                scopeId: role.scopeId,
              },
            },
          },
        },
        update: { $push: { roles: roleEntry } },
        projection: { _id: 1 },
      });
    }
  }

  if (removeRoles) {
    for (const role of removeRoles as {
      roleId?: string;
      name: string;
      scopeType?: string;
      scopeId?: string;
    }[]) {
      await user.findOneAndUpdate({
        filter: { _id: userId },
        update: {
          $pull: {
            roles: {
              name: role.name,
              ...(role.scopeType !== undefined && { scopeType: role.scopeType }),
              ...(role.scopeId !== undefined && { scopeId: role.scopeId }),
            },
          },
        },
        projection: { _id: 1 },
      });

      if (role.scopeType === "unit" && role.scopeId) {
        const unitObjId = new ObjectId(role.scopeId);
        await user.removeRelation({
          filters: { _id: userId },
          relations: {
            units: {
              _ids: [unitObjId],
              relatedRelations: {
                members: true,
              },
            },
          },
          projection: { _id: 1 },
        });
      }

      if (role.scopeType === "organization" && role.scopeId) {
        const orgObjId = new ObjectId(role.scopeId);
        await user.removeRelation({
          filters: { _id: userId },
          relations: {
            organizations: {
              _ids: [orgObjId],
              relatedRelations: {
                users: true,
              },
            },
          },
          projection: { _id: 1 },
        });
      }

      if (role.name === "UnitHead" && role.scopeId) {
        const currentUnit = await unit.findOne({
          filters: { _id: new ObjectId(role.scopeId) },
          projection: { head: { _id: 1 } },
        });
        if (currentUnit?.head) {
          const headId = (currentUnit.head as { _id?: ObjectId })._id?.toString?.() ||
            (currentUnit.head as ObjectId).toString?.();
          if (headId === userId.toString()) {
            await unit.removeRelation({
              filters: { _id: new ObjectId(role.scopeId) },
              relations: {
                head: {
                  _ids: userId,
                },
              },
              projection: { _id: 1 },
            });
          }
        }
      }

      if (role.name === "OrgHead" && role.scopeId) {
        const currentOrg = await organization.findOne({
          filters: { _id: new ObjectId(role.scopeId) },
          projection: { head: { _id: 1 } },
        });
        if (currentOrg?.head) {
          const headId = (currentOrg.head as { _id?: ObjectId })._id?.toString?.() ||
            (currentOrg.head as ObjectId).toString?.();
          if (headId === userId.toString()) {
            await organization.removeRelation({
              filters: { _id: new ObjectId(role.scopeId) },
              relations: {
                head: {
                  _ids: userId,
                },
              },
              projection: { _id: 1 },
            });
          }
        }
      }

      if (role.name === "StoreHead" && role.scopeId) {
        const currentStore = await store.findOne({
          filters: { _id: new ObjectId(role.scopeId) },
          projection: { storeHead: { _id: 1 } },
        });
        if (currentStore?.storeHead) {
          const headId = (currentStore.storeHead as { _id?: ObjectId })._id?.toString?.() ||
            (currentStore.storeHead as ObjectId).toString?.();
          if (headId === userId.toString()) {
            await store.removeRelation({
              filters: { _id: new ObjectId(role.scopeId) },
              relations: {
                storeHead: {
                  _ids: userId,
                },
              },
              projection: { _id: 1 },
            });
          }
        }
      }
    }
  }

  return await user.findOne({
    filters: { _id: userId },
    projection: get,
  });
};
