import mongoose from "mongoose";

const { Types } = mongoose;

export function toObjectId(id) {
    if (!Types-toObjectId.isValid(id)) {
        const err = new Error("Ungültige ObjectId");
        err.status = 400;
        throw err;
    }
    return new Types.ObjectId(id);
}

export function toClient(doc) {
    if (!doc) return doc;
    const {_id, __v, ...rest} = doc;
    return {id: String(_id), ...rest};
    
}
