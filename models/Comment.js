const mongoose = require("mongoose");
const CommentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Simplificamos esta parte para evitar el error "next is not a function"
CommentSchema.pre("save", function() {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model("Comment", CommentSchema);