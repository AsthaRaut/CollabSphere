import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    readme: { type: String, default: "" },
    isPublic: { type: Boolean, default: false },
    publicSlug: { type: String, unique: true, sparse: true }
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
