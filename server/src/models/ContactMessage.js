import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    topic: { type: String, trim: true, default: "general" },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "read", "archived"],
      default: "new",
      index: true
    }
  },
  { timestamps: true }
);

export const ContactMessage =
  mongoose.models.ContactMessage ||
  mongoose.model("ContactMessage", contactMessageSchema);
